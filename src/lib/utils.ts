import { Client, Message, MessageEmbed, MessageAttachment } from 'discord.js';
import { Command } from '@lib/types/Command';
import * as fs from 'fs';
import { DB } from '@root/config';
import moment from 'moment';

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

export async function generateLogEmbed(error: Error): Promise<MessageEmbed> {
	console.error(error);

	const embed = new MessageEmbed();

	embed.setTitle(error.name ? error.name : error.toString());

	if (error.message) {
		if (error.message.length < 1000) {
			embed.setDescription(`\`\`\`\n${error.message}\`\`\``);
		} else {
			embed.setDescription(`Full error message too big\n\`\`\`js\n${error.message.slice(0, 950)}...\`\`\``);
		}
	}

	if (error.stack) {
		if (error.stack.length < 1) {
			embed.addField('Stack Trace', `\`\`\`js\n${error.stack}\`\`\``, false);
		} else {
			embed.addField('Stack Trace', 'Full stack too big, sent to file.', false);
			embed.attachFiles([await sendToFile(error.stack, 'js', 'error', true)]);
		}
	}
	embed.setTimestamp();
	embed.setColor('RED');

	return embed;
}
