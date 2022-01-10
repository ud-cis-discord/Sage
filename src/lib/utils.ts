import { Client, Message, MessageAttachment } from 'discord.js';
import { Command } from '@lib/types/Command';
import * as fs from 'fs';
import { DB } from '@root/config';
import moment from 'moment';
import { Reminder } from '@lib/types/Reminder';

export function getCommand(bot: Client, cmd: string): Command {
	cmd = cmd.toLowerCase();
	return bot.commands.get(cmd) || bot.commands.find(command => command.aliases && command.aliases.includes(cmd));
}

export async function sendToFile(input: string, filetype = 'txt', filename: string = null, timestamp = false): Promise<MessageAttachment> {
	const time = moment().format('M-D-YY_HH-mm');
	filename = `${filename}${timestamp ? `_${time}` : ''}` || time;
	return new MessageAttachment(Buffer.from(input.trim()), `${filename}.${filetype}`);
}

export async function generateQuestionId(msg: Message, depth = 1): Promise<string> {
	const potentialId = `${msg.author.id.slice(msg.author.id.length - depth)}${msg.id.slice(msg.id.length - depth)}`;

	if (await msg.client.mongo.collection(DB.PVQ).countDocuments({ questionId: potentialId }) > 0) {
		return generateQuestionId(msg, depth + 1);
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
	const xpRatio = 1.25;
	if (direction === '+') { // calculate exp for next level
		return Math.floor(levelExp * xpRatio);
	}
	return Math.ceil(levelExp / xpRatio); // calculate exp for previous level
}
