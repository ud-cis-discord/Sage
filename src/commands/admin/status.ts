import { BOT } from '@root/config';
import { botMasterPerms } from '@lib/permissions';
import { Message } from 'discord.js';

export const description = `Sets ${BOT.NAME}'s status.`;
export const usage = '<online|idle|dnd|invisible>';

export async function permissions(msg: Message): Promise<boolean> {
	return botMasterPerms(msg);
}

export async function run(msg: Message, [status]: ['online' | 'idle' | 'dnd' | 'invisible']): Promise<Message> {
	const bot = msg.client;
	await bot.user.setStatus(status);

	return msg.channel.send(`Set ${BOT.NAME}'s status to ${status}`);
}

export function argParser(msg: Message, input: string): [string] {
	if (input === '') {
		throw `Usage: ${usage}`;
	}

	const validStatuses = ['online', 'idle', 'dnd', 'invisible'];

	if (!validStatuses.includes(input = input.trim().toLowerCase())) {
		throw `invalid status ${input}. Status must be one of ${validStatuses.join(', ')}`;
	}

	return [input];
}
