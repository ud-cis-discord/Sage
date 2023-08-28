import { DB, MAINTAINERS } from '@root/config';
import { SageUser } from '@lib/types/SageUser';
import { ChatInputCommandInteraction, InteractionResponse } from 'discord.js';
import { DatabaseError } from '@lib/types/errors';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Toggles whether your email (pii) will be sent to instructors over Discord.`;

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const entry: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: interaction.user.id });

		if (!entry) {
			interaction.reply({
				content: `Something went wrong when looking you up in our database. ${MAINTAINERS} have been notified.`,
				ephemeral: true
			});
			throw new DatabaseError(`Member ${interaction.user.username} (${interaction.user.id}) not in database`);
		}

		entry.pii = !entry.pii;

		interaction.client.mongo.collection(DB.USERS).updateOne({ discordId: interaction.user.id }, { $set: { pii: entry.pii } });

		return interaction.reply({ content: `Your personally identifiable information is now${entry.pii ? ' ABLE' : ' UNABLE'} to be sent by instructors over Discord.
${entry.pii ? '' : '**It is still available to staff outside of Discord.**'}`, ephemeral: true });
	}

}
