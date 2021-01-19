import { Client, Message } from 'discord.js';
import fetch from 'node-fetch';
import { Command } from '@lib/types/Command';
import { DB } from '@root/config';

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

	if (await msg.client.mongo.collection(DB.PVQ).countDocuments({ questionId: potentialId }) > 0) {
		return generateQuestionId(msg, depth + 1);
	}

	return potentialId;
}
