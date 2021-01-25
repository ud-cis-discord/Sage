import { DB, MAINTAINERS } from '@root/config';
import { SageUser } from '@lib/types/SageUser';
import { Message } from 'discord.js';

export const description = `Toggles whether or not your personally identifiable information will be sent by instructors over Discord.`;
export const aliases = ['pii'];

export async function run(msg: Message): Promise<Message> {
	const entry: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });

	if (!entry) {
		throw `Something went wrong. Please contact ${MAINTAINERS}`;
	}

	entry.pii = !entry.pii;

	msg.client.mongo.collection(DB.USERS).updateOne({ discordId: msg.author.id }, { $set: { pii: entry.pii } });

	return msg.author.send(`Your personally identifiable information is now${entry.pii ? ' ABLE' : ' UNABLE'} to be sent by instructors over Discord.`);
}
