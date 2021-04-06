import { ActivityType, Message } from 'discord.js';
import { BOT, DB } from '@root/config';
import { botMasterPerms } from '@lib/permissions';

export const description = `Sets ${BOT.NAME}'s activity to the given type and content`;
export const usage = '<type>|<content>';

export async function permissions(msg: Message): Promise<boolean> {
	return await botMasterPerms(msg);
}

export async function run(msg: Message, [type, name]: [ActivityType, string]): Promise<Message> {
	const bot = msg.client;
	bot.user.setActivity(name, { type });
	bot.mongo.collection(DB.CLIENT_DATA).updateOne(
		{ _id: bot.user.id },
		{ $set: { status: { type, name } } },
		{ upsert: true });
	return msg.channel.send(`set ${BOT.NAME}'s activity to ${type} ${name}`);
}

export function argParser(_msg: Message, input: string): [ActivityType, string] {
	const [type, content] = input.split('|').map(arg => arg.trim());
	if (!type || !content) {
		throw `Usage: ${usage}`;
	}

	const upperType = type.toUpperCase() as ActivityType;
	const activities = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];

	if (!activities.includes(upperType)) {
		throw `Invalid activity type ${type}, choose one of ${activities.map(a => a.toLowerCase()).join(', ')}.`;
	}

	return [upperType, content];
}
