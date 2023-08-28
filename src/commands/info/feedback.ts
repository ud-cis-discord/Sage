import { EmbedBuilder, TextChannel, ChatInputCommandInteraction, ApplicationCommandOptionData, ApplicationCommandOptionType, InteractionResponse } from 'discord.js';
import { BOT, CHANNELS, MAINTAINERS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Provide feedback or bug reports about ${BOT.NAME}.`;

	options: ApplicationCommandOptionData[] = [
		{
			name: 'feedback',
			description: 'feedback to be sent to the admins',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'file',
			description: 'A file to be posted with the feedback',
			type: ApplicationCommandOptionType.Attachment,
			required: false
		}
	]

	async run(interaction:ChatInputCommandInteraction): Promise<InteractionResponse<boolean>> {
		const feedback = interaction.options.getString('feedback');
		const file = interaction.options.getAttachment('file');
		const feedbackChannel = await interaction.guild.channels.fetch(CHANNELS.FEEDBACK) as TextChannel;

		const embed = new EmbedBuilder()
			.setAuthor({ name: interaction.user.tag, iconURL: interaction.user.avatarURL() })
			.setTitle('New Feedback')
			.setDescription(feedback)
			.setColor('DarkGreen')
			.setTimestamp();

		if (file) embed.setImage(file.url);

		feedbackChannel.send({ embeds: [embed] });

		return interaction.reply({ content: `Thanks! I've sent your feedback to ${MAINTAINERS}.`, ephemeral: true });
	}

}
