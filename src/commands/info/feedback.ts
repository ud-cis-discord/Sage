import { MessageEmbed, TextChannel, CommandInteraction } from 'discord.js';
import { BOT, CHANNELS, MAINTAINERS } from '@root/config';
import { Command, NonSubCommandOptionData } from '@lib/types/Command';

export default class extends Command {

	description = `Provide feedback or bug reports about ${BOT.NAME}.`;

	options: NonSubCommandOptionData[] = [
		{
			name: 'feedback',
			description: 'feedback to be sent to the admins',
			type: 'STRING',
			required: true
		}
	]

	async run(interaction:CommandInteraction): Promise<void> {
		const feedback = interaction.options.getString('feedback');
		const feedbackChannel = await interaction.guild.channels.fetch(CHANNELS.FEEDBACK) as TextChannel;

		const embed = new MessageEmbed()
			.setAuthor(interaction.user.tag, interaction.user.avatarURL({ dynamic: true }))
			.setTitle('New Feedback')
			.setDescription(feedback)
			.setColor('DARK_GREEN')
			.setTimestamp();

		feedbackChannel.send({ embeds: [embed] });

		return interaction.reply({ content: `Thanks! I've sent your feedback to ${MAINTAINERS}.`, ephemeral: true });
	}

}
