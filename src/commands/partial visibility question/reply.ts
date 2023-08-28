import { PVQuestion } from '@lib/types/PVQuestion';
import { BOT, DB } from '@root/config';
import { Command } from '@lib/types/Command';
import { EmbedBuilder, TextChannel, ChatInputCommandInteraction, ApplicationCommandOptionData, ApplicationCommandOptionType, InteractionResponse } from 'discord.js';
import { generateErrorEmbed } from '@lib/utils/generalUtils';


export default class extends Command {

	description = `Reply to a question you previously asked with ${BOT.NAME}.`;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'questionid',
			description: 'The ID of the question you would like to reply to',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'response',
			description: 'What you would like to reply with',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'file',
			description: 'A file to be posted with the reply',
			type: ApplicationCommandOptionType.Attachment,
			required: false
		}
	]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const id = interaction.options.getString('questionid');
		const file = interaction.options.getAttachment('file');
		const question: PVQuestion = await interaction.client.mongo.collection(DB.PVQ).findOne({ questionId: id });

		if (!question || question.type === 'private') {
			return interaction.reply({ embeds: [generateErrorEmbed(`Could not find an *anonymous* question with an ID of **${id}**.`)], ephemeral: true });
		}
		if (question.owner !== interaction.user.id) {
			return interaction.reply({ embeds: [generateErrorEmbed(`You are not the owner of question ID ${question.questionId}.`)], ephemeral: true });
		}

		const [, channelId] = question.messageLink.match(/\d\/(\d+)\//);
		const channel = await interaction.client.channels.fetch(channelId) as TextChannel;

		const embed = new EmbedBuilder()
			.setAuthor({ name: `Anonymous responded to ${question.questionId}`, iconURL: interaction.client.user.avatarURL() })
			.setDescription(`${interaction.options.getString('response')}\n\n[Jump to question](${question.messageLink})`);

		if (file) embed.setImage(file.url);

		channel.send({ embeds: [embed] });

		interaction.reply({ content: 'I\'ve forwarded your message along.', ephemeral: true });
	}

}
