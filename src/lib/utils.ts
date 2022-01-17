import { ApplicationCommandOptionData, ApplicationCommandPermissionData, Client, CommandInteraction, MessageAttachment, MessageEmbed } from 'discord.js';
import { Command, CompCommand } from '@lib/types/Command';
import * as fs from 'fs';
import { DB } from '@root/config';
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
	const valid = list1.every(list1Option => list2.find(list2Option =>
		list2Option.name === list1Option.name
			&& list2Option.description === list1Option.description
			&& list2Option.required === list1Option.required
			&& list2Option.type === list1Option.type
	));
	if (!valid) console.log('options list not quite right');
	return valid;
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
