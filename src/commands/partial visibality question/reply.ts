import { PVQuestion } from '@lib/types/PVQuestion';
import { BOT } from '@root/config';
import { MessageEmbed, Message, TextChannel } from 'discord.js';

export const description = `Reply to a question you previously asked with ${BOT.NAME}.`;
export const usage = '<questionID> <responce>';
export const runInGuild = false;

export async function run(msg: Message, [question, response]: [PVQuestion, string]): Promise<Message> {
	// return msg.channel.send(`question: ${question.questionId}\nresponce: ${responce}`);
	const [, channelId] = question.messageLink.match(/\d\/(\d+)\//);
	const channel = await msg.client.channels.fetch(channelId) as TextChannel;

	const shownAuthor = question.type === 'private' ? msg.author.tag : 'Anonymous';
	const shownAvatar = question.type === 'private' ? msg.author.avatarURL() : null;

	const embed = new MessageEmbed()
		.setAuthor(`${shownAuthor} responded to ${question.questionId}`, shownAvatar)
		.setDescription(`${responce}\n\n[Jump to question](${question.messageLink})`);

	return channel.send(embed)
		.then(() => msg.channel.send('I\'ve forwarded your message along.'));
}

export async function argParser(msg: Message, input: string): Promise<[PVQuestion, string]> {
	const question: PVQuestion = await msg.client.mongo.collection('pvQuestions').findOne({ questionId: input.split(' ')[0] });

	if (!question) throw `Could not find question with an ID of **${input.split(' ')[0]}**.`;
	if (question.owner !== msg.author.id) throw `You are not the owner of ${question.questionId}.`;

	return [question, input.slice(question.questionId.length).trim()];
}
