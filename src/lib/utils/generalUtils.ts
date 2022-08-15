import {
	ApplicationCommandOptionData, Client, CommandInteraction, Message, MessageAttachment,
	MessageEmbed, Role, TextChannel, MessageActionRow, ApplicationCommandPermissionData,
	MessageSelectMenu, MessageSelectOptionData
} from 'discord.js';
import { Command, CompCommand } from '@lib/types/Command';
import * as fs from 'fs';
import { DB, CHANNELS, ROLE_DROPDOWNS, BOT } from '@root/config';
import moment from 'moment';
import { Reminder } from '@lib/types/Reminder';

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

export function isPermissionEqual(perm1: ApplicationCommandPermissionData, perm2: ApplicationCommandPermissionData): boolean {
	return perm1.id === perm2.id
		&& perm1.permission === perm2.permission
		&& perm1.type === perm2.type;
}

export function generateErrorEmbed(msg: string): MessageEmbed {
	const responseEmbed = new MessageEmbed()
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

export async function modifyRoleDD(interaction: CommandInteraction, role: Role, isCourse: boolean, dropdownAction: 'ADD' | 'REMOVE'): Promise<boolean> {
	let rolesMsg: Message;
	const channel = await interaction.guild.channels.fetch(CHANNELS.ROLE_SELECT) as TextChannel;
	if (!channel || channel.type !== 'GUILD_TEXT') {
		const responseEmbed = new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('Argument error')
			.setDescription(`Could not find channel.`);
		interaction.channel.send({ embeds: [responseEmbed] });
		return false;
	}
	try {
		rolesMsg = await channel.messages.fetch(
			isCourse ? ROLE_DROPDOWNS.COURSE_ROLES : ROLE_DROPDOWNS.ASSIGN_ROLES, { cache: true, force: true }
		);
	} catch (error) {
		const responseEmbed = new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('Argument error')
			.setDescription(`Unknown message, make sure your channel and message ID are correct.`);
		interaction.channel.send({ embeds: [responseEmbed] });
		return false;
	}
	if (rolesMsg.author.id !== BOT.CLIENT_ID) {
		const responseEmbed = new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('Argument error')
			.setDescription(`You must tag a message that was sent by ${BOT.NAME} (me!).`);
		interaction.channel.send({ embeds: [responseEmbed] });
		return false;
	}

	// the message component row that the dropdown is in
	let dropdownRow = rolesMsg.components[0] as MessageActionRow;
	if (!dropdownRow) dropdownRow = new MessageActionRow();

	const option: MessageSelectOptionData = { label: role.name, value: role.id };

	const menu = dropdownRow.components[0] as MessageSelectMenu;
	switch (dropdownAction) {
		case 'ADD':
			return addRole(interaction, rolesMsg, menu, option, dropdownRow, isCourse);
		case 'REMOVE':
			return removeRole(interaction, rolesMsg, menu, option, dropdownRow);
	}
}

export type TimestampType = 't' | 'T' | 'd' | 'D' | 'f' | 'F' | 'R';
export function dateToTimestamp(date: Date, type: TimestampType = 't'): string {
	return `<t:${Math.round(date.valueOf() / 1e3)}:${type}>`;
}

function addRole(interaction: CommandInteraction,
	rolesMsg: Message,
	menu: MessageSelectMenu,
	option: MessageSelectOptionData,
	dropdownRow: MessageActionRow,
	isCourse: boolean): boolean {
	if (menu) {
		menu.options.forEach(menuOption => {
			if (menuOption.value === option.value) {
				const responseEmbed = new MessageEmbed()
					.setColor('#ff0000')
					.setTitle('Argument error')
					.setDescription(`${option.label} is in this message's role select menu already.`);
				interaction.channel.send({ embeds: [responseEmbed] });
				return false;
			}
		});
		menu.addOptions([option]);
		menu.setMaxValues(menu.options.length);
		menu.options.sort((x, y) => x.label > y.label ? 1 : -1);
	} else {
		dropdownRow.addComponents(
			new MessageSelectMenu()
				.setCustomId('roleselect')
				.setMinValues(0)
				.setMaxValues(1)
				.setPlaceholder(`Select your ${isCourse ? 'course' : 'role'}(s)`)
				.addOptions([option])
		);
	}
	rolesMsg.edit({ components: [dropdownRow] });
	return true;
}

function removeRole(interaction: CommandInteraction,
	rolesMsg: Message,
	menu: MessageSelectMenu,
	option: MessageSelectOptionData,
	dropdownRow: MessageActionRow): boolean {
	let cont = true;
	if (!menu) {
		const responseEmbed = new MessageEmbed()
			.setColor('#ff0000')
			.setTitle('Argument error')
			.setDescription(`This message does not have a role dropdown menu.`);
		interaction.channel.send({ embeds: [responseEmbed] });
		return false;
	}

	menu.options.forEach((menuOption, index) => {
		if (menuOption.value !== option.value) return;

		menu.spliceOptions(index, 1);
		menu.setMaxValues(menu.options.length);
		menu.options.sort((x, y) => x.label > y.label ? 1 : -1);
		rolesMsg.edit({ components: menu.options.length > 0 ? [dropdownRow] : [] });
		cont = false;
	});

	if (!cont) return true;

	const responseEmbed = new MessageEmbed()
		.setColor('#ff0000')
		.setTitle('Argument error')
		.setDescription(`${option.label} was not found in that message's role select menu. The role, however, has still been removed from the server and the database.`);
	interaction.editReply({ embeds: [responseEmbed] });
	return false;
}

export async function sendToFile(input: string, filetype = 'txt', filename: string = null, timestamp = false): Promise<MessageAttachment> {
	const time = moment().format('M-D-YY_HH-mm');
	filename = `${filename}${timestamp ? `_${time}` : ''}` || time;
	return new MessageAttachment(Buffer.from(input.trim()), `${filename}.${filetype}`);
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
