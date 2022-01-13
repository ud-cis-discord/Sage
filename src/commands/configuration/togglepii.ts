import { DB } from '@root/config';
import { SageUser } from '@lib/types/SageUser';
import { CommandInteraction, Message } from 'discord.js';
import { DatabaseError } from '@lib/types/errors';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Toggles whether your personally identifiable information will be sent to instructors over Discord.`;
	aliases = ['pii'];

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const entry: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: interaction.user.id });

		if (!entry) {
			throw new DatabaseError(`Member ${interaction.user.username} (${interaction.user.id}) not in database`);
		}

		entry.pii = !entry.pii;

		interaction.client.mongo.collection(DB.USERS).updateOne({ discordId: interaction.user.id }, { $set: { pii: entry.pii } });

		return interaction.reply({ content: `Your personally identifiable information is now${entry.pii ? ' ABLE' : ' UNABLE'} to be sent by instructors over Discord.
${entry.pii ? '' : '**It is still available to staff outside of Discord.**'}`, ephemeral: true });
	}

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
