import { PVQuestion } from '@lib/types/PVQuestion';
import { BOT, DB } from '@root/config';
import { Command } from '@lib/types/Command';
import { MessageEmbed, Message, TextChannel, CommandInteraction, ApplicationCommandOptionData } from 'discord.js';


export default class extends Command {

	description = `Reply to a question you previously asked with ${BOT.NAME}.`;
	usage = '<questionID> <response>';
	options: ApplicationCommandOptionData[] = [
		{
			name: 'questionid',
			description: 'The ID of the question you would like to reply to',
			type: 'STRING',
			required: true
		},
		{
			name: 'response',
			description: 'What would you like to reply with?',
			type: 'STRING',
			required: true
		}
	]

	run(_msg: Message): Promise<void> { return; }

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const id = interaction.options.getString('questionid');
		const question: PVQuestion = await interaction.client.mongo.collection(DB.PVQ).findOne({ questionId: id });

		if (!question || question.type === 'private') {
			const responseEmbed = new MessageEmbed()
				.setTitle(`Error`)
				.setDescription(`Could not find an *anonymous* question with an ID of **${id}**.`)
				.setColor('#ff0000');
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		}
		if (question.owner !== interaction.user.id) {
			const responseEmbed = new MessageEmbed()
				.setTitle(`Error`)
				.setDescription(`You are not the owner of question ID ${question.questionId}.`)
				.setColor('#ff0000');
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		}

		const [, channelId] = question.messageLink.match(/\d\/(\d+)\//);
		const channel = await interaction.client.channels.fetch(channelId) as TextChannel;

		const embed = new MessageEmbed()
			.setAuthor(`Anonymous responded to ${question.questionId}`, interaction.client.user.avatarURL())
			.setDescription(`${interaction.options.getString('response')}\n\n[Jump to question](${question.messageLink})`);

		channel.send({ embeds: [embed] });

		interaction.reply({ content: 'I\'ve forwarded your message along.', ephemeral: true });
	}

}
