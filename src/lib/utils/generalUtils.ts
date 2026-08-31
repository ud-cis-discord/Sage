import {
	ApplicationCommandOptionData, Client, CommandInteraction, AttachmentBuilder,
	EmbedBuilder, TextChannel, ActionRowBuilder, ApplicationCommandPermissions,
	StringSelectMenuBuilder, Message
} from 'discord.js';
import { Command, CompCommand } from '@lib/types/Command';
import * as fs from 'fs';
import { DB, CHANNELS, ROLE_DROPDOWNS, BOT, MAINTAINERS } from '@root/config';
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
	// refreshing the dropdowns is best-effort: whatever command called us has already done its real work,
	// so a problem here is reported rather than thrown back at the caller
	try {
		await refreshDropdowns(interaction);
	} catch (error) {
		interaction.client.emit('error', error);
		await reportDropdownProblem(interaction, 'Error', `The role dropdowns couldn't be updated. ${MAINTAINERS} have been notified.`);
	}
}

async function refreshDropdowns(interaction: CommandInteraction): Promise<void> {
	/*
	Here in this function lies the genius ideas of Ben Segal, the OG admin
	Thank you Ben for making v14 refactoring so much easier, now I'll just find some more hair having pulled all of mine out
	- S
	*/
	const channel = await interaction.guild.channels.fetch(CHANNELS.ROLE_SELECT) as TextChannel;
	if (!channel) {
		await reportDropdownProblem(interaction, 'Argument error', `Unknown channel, make sure the role select channel ID in the config is correct.`);
		return;
	}
	let coursesMsg, assignablesMsg;

	// find both dropdown messages, based on what's in the config
	try {
		coursesMsg = await channel.messages.fetch(ROLE_DROPDOWNS.COURSE_ROLES);
		assignablesMsg = await channel.messages.fetch(ROLE_DROPDOWNS.ASSIGN_ROLES);
	} catch (error) {
		// the dropdowns can't be updated without both messages, so stop here instead of using them anyway
		await reportDropdownProblem(interaction, 'Argument error', `Unknown message(s), make sure your channel and message ID are correct.`);
		return;
	}
	if (coursesMsg.author.id !== BOT.CLIENT_ID || assignablesMsg.author.id !== BOT.CLIENT_ID) {
		await reportDropdownProblem(interaction, 'Argument error', `You must tag a message that was sent by ${BOT.NAME} (me!).`);
		return;
	}

	// get roles from DB
	let courses: Array<Course> = await interaction.client.mongo.collection(DB.COURSES).find().toArray();
	const assignableRoles = await interaction.client.mongo.collection(DB.ASSIGNABLE).find().toArray();
	let assignables = [];
	for (const role of assignableRoles) {
		// a role that's been deleted from the server but not the database shouldn't take the whole dropdown down
		const guildRole = await interaction.guild.roles.fetch(role.id).catch(() => null);
		if (!guildRole) continue;
		assignables.push({ name: guildRole.name, id: role.id });
	}

	// sort alphabetically
	courses = courses.sort((a, b) => a.name > b.name ? 1 : -1);
	assignables = assignables.sort((a, b) => a.name > b.name ? 1 : -1);

	// each dropdown is updated on its own so a problem with one doesn't leave the other stale
	await editDropdown(interaction, coursesMsg, 'course', courses.map(c => ({ label: `CISC ${c.name}`, value: c.roles.student })));
	await editDropdown(interaction, assignablesMsg, 'assignable role', assignables.map(a => ({ label: a.name, value: a.id })));

	return;
}

// Discord only allows this many options in a single string select menu
const MAX_DROPDOWN_OPTIONS = 25;

async function editDropdown(interaction: CommandInteraction, message: Message, label: string,
	options: Array<{ label: string, value: string }>): Promise<void> {
	// building a menu with too few/too many options throws, which would abort whatever command called us
	if (options.length < 1 || options.length > MAX_DROPDOWN_OPTIONS) {
		await reportDropdownProblem(interaction, 'Error',
			`The ${label} dropdown couldn't be updated: Discord allows 1-${MAX_DROPDOWN_OPTIONS} options per dropdown, but there are ${options.length} ${label}s.`);
		return;
	}

	const dropdown = new StringSelectMenuBuilder()
		.setCustomId('roleselect')
		.setMaxValues(options.length)
		.setMinValues(0);
	// this has to be here otherwise it won't add the dropdown components
	// typings reference - https://discord-api-types.dev/api/discord-api-types-v10/enum/ComponentType
	dropdown.data.type = 3;
	dropdown.addOptions(options);

	const row = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(dropdown);
	try {
		await message.edit({ components: [row] });
	} catch (error) {
		// a stale dropdown shouldn't abort the command that triggered this update
		interaction.client.emit('error', error);
		await reportDropdownProblem(interaction, 'Error', `The ${label} dropdown couldn't be updated. ${MAINTAINERS} have been notified.`);
	}
}

async function reportDropdownProblem(interaction: CommandInteraction, title: string, description: string): Promise<void> {
	const responseEmbed = new EmbedBuilder()
		.setColor('#ff0000')
		.setTitle(title)
		.setDescription(description);
	// this is also called from updateDropdowns' own catch, so it must never throw
	await interaction.channel?.send({ embeds: [responseEmbed] }).catch(error => interaction.client.emit('error', error));
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
