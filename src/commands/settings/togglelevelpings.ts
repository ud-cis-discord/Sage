import { DB } from '@root/config';
import { SageUser } from '@lib/types/SageUser';
import { Message } from 'discord.js';
import { DatabaseError } from '@lib/types/errors';

export const description = `Toggles whether or not you will receive notifications from Sage on a level up.`;
export const aliases = ['levelpings', 'lp'];

export async function run(msg: Message): Promise<Message> {
	const entry: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });

	if (!entry) {
		throw new DatabaseError(`Member ${msg.author.username} (${msg.author.id}) not in database`);
	}

	entry.levelPings = !entry.levelPings;

	msg.client.mongo.collection(DB.USERS).updateOne({ discordId: msg.author.id }, { $set: { levelPings: entry.levelPings } });

	return msg.channel.send(`You will${entry.levelPings ? ' now' : ' no longer'} receive notifications from Sage on a level up.`);
}
