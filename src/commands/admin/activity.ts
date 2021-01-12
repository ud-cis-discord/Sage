import { ActivityType, Message } from 'discord.js';
import { BOT } from '@root/config';
import { botMasterPerms } from '@lib/permissions';

export const description = `Sets ${BOT.NAME}'s activity to the given type and content`;
export const usage = '<type>|<content>';

export async function permissions(msg: Message): Promise<boolean> {
	return botMasterPerms(msg);
}

export async function run(msg: Message, [type, content]: [ActivityType, string]): Promise<Message> {
	const bot = msg.client;
	bot.user.setActivity(`${content}`, { type: type });
	return msg.channel.send(`set ${BOT.NAME}'s activity to ${type} ${content}`);
}

export function argParser(msg: Message, input: string): [string, string] {
	const [type, content] = input.split('|').map(arg => arg.trim());
	if (!type || !content) {
		throw `Usage: ${usage}`;
	}

	const upperType = type.toUpperCase();
	const activities = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];

	if (!activities.includes(upperType)) {
		throw `Invalid activity type ${type}, choose one of ${activities.map(a => a.toLowerCase()).join(', ')}.`;
	}

	return [upperType, content];
}
