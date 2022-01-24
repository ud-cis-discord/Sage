import { DB } from '@root/config';
import { SageUser } from '@lib/types/SageUser';
import { CommandInteraction } from 'discord.js';
import { DatabaseError } from '@lib/types/errors';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Toggles whether or not you will receive notifications from Sage on a level up.`;

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const entry: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: interaction.user.id });

		if (!entry) {
			throw new DatabaseError(`Member ${interaction.user.username} (${interaction.user.id}) not in database`);
		}

		entry.levelPings = !entry.levelPings;
		interaction.client.mongo.collection(DB.USERS).updateOne({ discordId: interaction.user.id }, { $set: { levelPings: entry.levelPings } });
		return interaction.reply({ content: `You will${entry.levelPings ? ' now' : ' no longer'} receive notifications from Sage on a level up.`, ephemeral: true });
	}

	async run(): Promise<void> {
		return;
	}

}
