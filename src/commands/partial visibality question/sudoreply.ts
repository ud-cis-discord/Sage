import { PVQuestion } from '@lib/types/PVQuestion';
import { BOT, PREFIX } from '@root/config';
import { staffPerms } from '@lib/permissions';
import { Message, MessageEmbed } from 'discord.js';

export const description = `Reply to a question asked through ${BOT.NAME}.`;
export const usage = '<questionID> <responce>';
export const extendedHelp = 'Responces get sent to the askers DMs. This command will tell you it failed if it cannont send the DM.';
export const runInDM = false;
export const aliases = ['sreply'];

export function permissions(msg: Message): boolean {
	return staffPerms(msg);
}

export async function run(msg: Message, [question, responce]: [PVQuestion, string]): Promise<Message> {
	const asker = await msg.client.users.fetch(question.owner);
	const embed = new MessageEmbed()
		.setAuthor(`${msg.author.tag} replied to question ${question.questionId}`, msg.author.avatarURL())
		.setDescription(responce)
		.setFooter(`To respond do ${PREFIX}reply ${question.questionId} <responce>`);

	return asker.send(embed)
		.then(() => msg.channel.send(`I've sent your responce to ${asker.username}.`))
		.catch(() => msg.channel.send(`I couldn't send your resonce. ${asker.username} may have DMs disabled.`));
}

export async function argParser(msg: Message, input: string): Promise<[PVQuestion, string]> {
	const question: PVQuestion = await msg.client.mongo.collection('pvQuestions').findOne({ questionId: input.split(' ')[0] });

	if (!question) throw `Could not find question with an ID of **${input.split(' ')[0]}**.`;

	return [question, input.slice(question.questionId.length).trim()];
}
