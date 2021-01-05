import { Message } from 'discord.js';

export const decription = 'Ask the 8ball a question and you shall get an answer.';
export const extendedHelp = 'This command requires you to put a question mark at the end of your question.';
export const useage = '[question]';

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

export function run(msg: Message, question: string[]): Promise<Message> {
	console.log(`${question.length}`);
	if (question.length !== 0 && question[question.length - 1].endsWith('?')) {
		return msg.channel.send(MAGIC8BALL_RESPONSES[
			Math.floor(Math.random() * MAGIC8BALL_RESPONSES.length)]);
	} else {
		return msg.channel.send('The 8ball only responds to questions smh');
	}
}
