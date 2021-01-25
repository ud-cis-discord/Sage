import { DB, MAINTAINERS } from '@root/config';
import { SageUser } from '@lib/types/SageUser';
import { Message } from 'discord.js';

export const description = `Toggles whether or not you will receive notifications from Sage on a level up.`;
export const aliases = ['levelpings', 'lp'];

export async function run(msg: Message): Promise<Message> {
	const entry: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });

	if (!entry) {
		throw `Something went wrong. Please contact ${MAINTAINERS}`;
	}

	entry.levelPings = !entry.levelPings;

	msg.client.mongo.collection(DB.USERS).updateOne({ discordId: msg.author.id }, { $set: { levelPings: entry.levelPings } });

	return msg.channel.send(`You will${entry.levelPings ? ' now' : ' no longer'} receive notifications from Sage on a level up.`);
}
