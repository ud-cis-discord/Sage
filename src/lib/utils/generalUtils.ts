import {
	ApplicationCommandOptionData, Client, CommandInteraction, AttachmentBuilder,
	EmbedBuilder, TextChannel, ActionRowBuilder, ApplicationCommandPermissions,
	StringSelectMenuBuilder
} from 'discord.js';
import { Command, CompCommand } from '@lib/types/Command';
import * as fs from 'fs';
import { DB, CHANNELS, ROLE_DROPDOWNS, BOT } from '@root/config';
import moment from 'moment';
import { Reminder } from '@lib/types/Reminder';
import { Course } from '@lib/types/Course';

export function getCommand(bot: Client, cmd: string): Command {
	cmd = cmd.toLowerCase();
	return bot.commands.get(cmd) || bot.commands.find(command => command.aliases && command.aliases.includes(cmd));
}

export function isCmdEqual(cmd1: CompCommand, cmd2: CompCommand): boolean {
	return cmd1.name === cmd2.name
		&& cmd1.description === cmd2.description
		&& isOptionsListEqual(cmd1.options, cmd2.options);
}

export function isOptionsListEqual(list1: ApplicationCommandOptionData[], list2: ApplicationCommandOptionData[]): boolean {
	if (list1.length !== list2.length) return false;
	const valid = list1.every(list1Option => list2.find(list2Option =>
		list2Option.name === list1Option.name
			&& list2Option.description === list1Option.description
			&& checkOptions(list1Option, list2Option)
			&& list2Option.type === list1Option.type
	));
	return valid;
}

function checkOptions(list1Option: ApplicationCommandOptionData, list2Option: ApplicationCommandOptionData): boolean {
	if ('required' in list1Option && 'required' in list2Option) { // see note 1 comment block in help.ts
		return list2Option.required === list1Option.required;
	}
	return false;
}

export function isPermissionEqual(perm1: ApplicationCommandPermissions, perm2: ApplicationCommandPermissions): boolean {
	return perm1.id === perm2.id
		&& perm1.permission === perm2.permission
		&& perm1.type === perm2.type;
}

export function generateErrorEmbed(msg: string): EmbedBuilder {
	const responseEmbed = new EmbedBuilder()
		.setColor('#ff0000')
		.setTitle('Error')
		.setDescription(msg);
	return responseEmbed;
}

export function getMsgIdFromLink(link: string): string {
	let msgId: string;
	if ((msgId = link.split('/').pop()) === undefined) throw 'You must call this function with a message link!';
	return msgId;
}

export async function updateDropdowns(interaction: CommandInteraction): Promise<void> {
	/*
	Here in this function lies the genius ideas of Ben Segal, the OG admin
	Thank you Ben for making v14 refactoring so much easier, now I'll just find some more hair having pulled all of mine out
	- S
	*/
	const channel = await interaction.guild.channels.fetch(CHANNELS.ROLE_SELECT) as TextChannel;
	let coursesMsg, assignablesMsg;

	// find both dropdown messages, based on what's in the config
	try {
		coursesMsg = await channel.messages.fetch(ROLE_DROPDOWNS.COURSE_ROLES);
		assignablesMsg = await channel.messages.fetch(ROLE_DROPDOWNS.ASSIGN_ROLES);
	} catch (error) {
		const responseEmbed = new EmbedBuilder()
			.setColor('#ff0000')
			.setTitle('Argument error')
			.setDescription(`Unknown message(s), make sure your channel and message ID are correct.`);
		interaction.channel.send({ embeds: [responseEmbed] });
	}
	if (coursesMsg.author.id !== BOT.CLIENT_ID || assignablesMsg.author.id !== BOT.CLIENT_ID) {
		const responseEmbed = new EmbedBuilder()
			.setColor('#ff0000')
			.setTitle('Argument error')
			.setDescription(`You must tag a message that was sent by ${BOT.NAME} (me!).`);
		interaction.channel.send({ embeds: [responseEmbed] });
	}

	// get roles from DB
	let courses: Array<Course> = await interaction.client.mongo.collection(DB.COURSES).find().toArray();
	const assignableRoles = await interaction.client.mongo.collection(DB.ASSIGNABLE).find().toArray();
	let assignables = [];
	for (const role of assignableRoles) {
		const { name } = await interaction.guild.roles.fetch(role.id);
		assignables.push({ name, id: role.id });
	}

	// sort alphabetically
	courses = courses.sort((a, b) => a.name > b.name ? 1 : -1);
	assignables = assignables.sort((a, b) => a.name > b.name ? 1 : -1);

	// initialize dropdowns
	const coursesDropdown = new StringSelectMenuBuilder()
		.setCustomId('roleselect')
		.setMaxValues(courses.length)
		.setMinValues(0);
	const assignablesDropdown = new StringSelectMenuBuilder()
		.setCustomId('roleselect')
		.setMaxValues(assignables.length)
		.setMinValues(0);
	// these have to be here otherwise it won't add the dropdown components
	// typings reference - https://discord-api-types.dev/api/discord-api-types-v10/enum/ComponentType
	coursesDropdown.data.type = 3;
	assignablesDropdown.data.type = 3;

	// add options to dropdowns
	coursesDropdown.addOptions(courses.map(c => ({ label: `CISC ${c.name}`, value: c.roles.student })));
	assignablesDropdown.addOptions(assignables.map(a => ({ label: a.name, value: a.id })));

	// create component rows, add to messages
	const coursesRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(coursesDropdown);
	const assignablesRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(assignablesDropdown);
	coursesMsg.edit({ components: [coursesRow] });
	assignablesMsg.edit({ components: [assignablesRow] });

	return;
}

export type TimestampType = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';
export function dateToTimestamp(date: Date, type: TimestampType = 't'): string {
	return `<t:${Math.round(date.valueOf() / 1e3)}:${type}>`;
}

export async function sendToFile(input: string, filetype = 'txt', filename: string = null, timestamp = false): Promise<AttachmentBuilder> {
	const time = moment().format('M-D-YY_HH-mm');
	filename = `${filename}${timestamp ? `_${time}` : ''}` || time;
	return new AttachmentBuilder(Buffer.from(input.trim()), { name: `${filename}.${filetype}` });
}

export async function generateQuestionId(interaction: CommandInteraction, depth = 1): Promise<string> {
	const potentialId = `${interaction.user.id.slice(interaction.user.id.length - depth)}${interaction.id.slice(interaction.id.length - depth)}`;

	if (await interaction.client.mongo.collection(DB.PVQ).countDocuments({ questionId: potentialId }) > 0) {
		return generateQuestionId(interaction, depth + 1);
	}

	return potentialId;
}

export function readdirRecursive(dir: string): string[] {
	let results = [];
	const list = fs.readdirSync(dir);
	list.forEach((file) => {
		file = `${dir}/${file}`;
		const stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			/* Recurse into a subdirectory */
			results = results.concat(readdirRecursive(file));
		} else {
			/* Is a file */
			results.push(file);
		}
	});
	return results;
}

export function reminderTime({ expires: date, repeat }: Reminder): string {
	const now = new Date();
	let prettyDateTime = '';

	const hour = date.getHours() % 12 === 0 ? 12 : date.getHours() % 12;
	const mins = date.getMinutes();
	const amPm = date.getHours() < 12 ? 'AM' : 'PM';
	prettyDateTime += `${hour}:${mins.toString().padStart(2, '0')} ${amPm} `;

	if (repeat === 'daily') {
		prettyDateTime += 'every day';
		return prettyDateTime;
	}

	if (!(now.getDate() === date.getDate() && now.getMonth() === date.getMonth() && now.getFullYear() === date.getFullYear())) {
		prettyDateTime += `on ${date.getMonth() + 1}/${date.getDate()}/${date.getFullYear()}`;
	} else {
		prettyDateTime += 'Today';
	}

	if (repeat === 'weekly') {
		prettyDateTime += ' and every week';
	}

	return prettyDateTime;
}

export function calcNeededExp(levelExp: number, direction: string): number {
	const xpRatio = 1.31; // Ren and I had an argument over whether it should be 1.3 or 1.33, we agreed on 1.31 because haha :)
	if (direction === '+') { // calculate exp for next level
		return Math.floor(levelExp * xpRatio);
	}
	return Math.ceil(levelExp / xpRatio); // calculate exp for previous level
}
