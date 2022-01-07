import { DB } from '@root/config';
import { SageUser } from '@lib/types/SageUser';
import { Message } from 'discord.js';
import { DatabaseError } from '@lib/types/errors';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Toggles whether or not your personally identifiable information will be sent by instructors over Discord.`;
	aliases = ['pii'];

	async run(msg: Message): Promise<Message> {
		const entry: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });

		if (!entry) {
			throw new DatabaseError(`Member ${msg.author.username} (${msg.author.id}) not in database`);
		}

		entry.pii = !entry.pii;

		msg.client.mongo.collection(DB.USERS).updateOne({ discordId: msg.author.id }, { $set: { pii: entry.pii } });

		return msg.channel.send(`Your personally identifiable information is now${entry.pii ? ' ABLE' : ' UNABLE'} to be sent by instructors over Discord.
${entry.pii ? '' : '**It is still available to staff outside of Discord.**'}`);
	}

}
