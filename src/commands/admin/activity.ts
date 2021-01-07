import { SageClient } from '@lib/types/SageClient';
import { ActivityType, Message } from 'discord.js';
import { ROLES, BOT } from '@root/config';

export const description = `Sets ${BOT.NAME}'s activity to the given type and content`;
export const usage = '<type|content>';

export function permissions(msg: Message): boolean {
	return msg.member.roles.cache.has(ROLES.ADMIN);
}

export async function run(msg: Message, [type, content]: [ActivityType, string]): Promise<Message> {
	const bot = msg.client as SageClient;
	bot.user.setActivity(`${content}`, { type: type });
	return msg.channel.send(`set ${BOT.NAME}'s activity to ${type} ${content}`);
}

export function argParser(msg: Message, input: string): [string, string] {
	const [type, content] = input.split('|').map(arg => arg.trim());
	const upperType = type.toUpperCase();
	const activities = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];

	if (!activities.includes(upperType)) {
		throw `Invalid activity type ${type}, choose one of ${activities}.`;
	}

	return [upperType, content];
}
