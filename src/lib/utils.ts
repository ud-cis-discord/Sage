import { Client, Message, MessageEmbed, EmbedField } from 'discord.js';
import fetch from 'node-fetch';
import { Command } from '@lib/types/Command';
import * as fs from 'fs';

export function getCommand(bot: Client, cmd: string): Command {
	cmd = cmd.toLowerCase();
	return bot.commands.get(cmd) || bot.commands.find(command => command.aliases && command.aliases.includes(cmd));
}

export async function sendToHastebin(input: string, filetype = 'txt'): Promise<string> {
	if (input.length < 1900) return input;

	const res = await fetch('https://hastebin.com/documents', { method: 'POST', body: input }).then(r => r.json());
	return `Result too long for Discord, uploaded to hastebin: <https://hastebin.com/${res.key}.${filetype}>`;
}

export async function generateQuestionId(msg: Message, depth = 1): Promise<string> {
	const potentialId = `${msg.author.id.slice(msg.author.id.length - depth)}${msg.id.slice(msg.id.length - depth)}`;

	if (await msg.client.mongo.collection('pvQuestions').countDocuments({ questionId: potentialId }) > 0) {
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

export async function logError(error: Error): Promise<MessageEmbed> {
	let errTitle = '';
	let errMessage = '';
	const fields: Array<EmbedField> = [];

	if (error.name) {
		errTitle = error.name;
	} else {
		errTitle = error.toString();
	}

	if (error.message) {
		errMessage = error.message.length < 1900
			? `\`\`\`\n${error.message}\`\`\``
			: await sendToHastebin(error.message);
	}

	if (error.stack) {
		fields.push({
			name: 'Stack Trace',
			value: error.stack.length < 1900
				? `\`\`\`js\n${error.stack}\`\`\``
				: await sendToHastebin(error.stack, 'js'),
			inline: false
		});
	}

	return new MessageEmbed()
		.setTitle(errTitle)
		.setDescription(errMessage)
		.addFields(fields)
		.setTimestamp()
		.setColor('RED');
}
