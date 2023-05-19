import { Command } from '@lib/types/Command';
import { generateErrorEmbed } from '@lib/utils/generalUtils';
import { ChatInputCommandInteraction, InteractionResponse } from 'discord.js';

export default class extends Command {

	description = `Archive a private question thread.`;
	extendedHelp = `This command only works in private question threads.`;

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		if (!interaction.channel.isThread()) {
			return interaction.reply({ embeds: [generateErrorEmbed('You must run this command in a private question thread.')], ephemeral: true });
		}
		await interaction.reply(`Archiving thread...`);
		await interaction.channel.setArchived(true, `${interaction.user.username} archived the question.`);
		interaction.editReply(`Thread archived.`);
	}

}
