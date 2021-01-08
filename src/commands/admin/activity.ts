import { SageClient } from '@lib/types/SageClient';
import { ActivityType, Message, Team } from 'discord.js';
import { BOT } from '@root/config';

export const description = `Sets ${BOT.NAME}'s activity to the given type and content`;
export const usage = '<type>|<content>';

export async function permissions(msg: Message): Promise<boolean> {
	const team = (await msg.client.fetchApplication()).owner as Team;
	return team.members.has(msg.author.id);
}

export async function run(msg: Message, [type, content]: [ActivityType, string]): Promise<Message> {
	const bot = msg.client as SageClient;
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
