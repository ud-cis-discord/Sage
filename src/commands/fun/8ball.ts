import { ApplicationCommandOptionData, ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';

const MAGIC8BALL_RESPONSES = [
	'As I see it, yes.',
	'Ask again later.',
	'Better not tell you now.',
	'Cannot predict now.',
	'Concentrate and ask again.',
	'Don’t count on it.',
	'It is certain.',
	'It is decidedly so.',
	'Most likely.',
	'My reply is no.',
	'My sources say no.',
	'Outlook not so good.',
	'Outlook good.',
	'Reply hazy, try again.',
	'Signs point to yes.',
	'Very doubtful.',
	'Without a doubt.',
	'Yes.',
	'Yes – definitely.',
	'You may rely on it.'
];

export default class extends Command {

	description = `Ask the 8-ball a question and you shall get an answer.`;
	extendedHelp = `This command requires you to put a question mark ('?') at the end of your message.`;

	options: ApplicationCommandOptionData[] = [
		{
			name: 'question',
			description: 'The question you want to ask',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	]

	run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const question = interaction.options.getString('question');
		const response = question.length !== 0 && (question[question.length - 1].endsWith('?') || question.endsWith('?!'))
			?	MAGIC8BALL_RESPONSES[Math.floor(Math.random() * MAGIC8BALL_RESPONSES.length)]
			:	'The 8-ball only responds to questions smh';
		const responseEmbed = new EmbedBuilder()
			.setColor('#000000')
			.setTitle('The magic 8-ball says...')
			.setDescription(response)
			.setImage(`https://i.imgur.com/UFPWxHV.png`)
			.setFooter({ text: `${interaction.user.username} asked: ${question}` });
		return interaction.reply({ embeds: [responseEmbed] });
	}

}
