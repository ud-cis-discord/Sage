import { PVQuestion } from '@lib/types/PVQuestion';
import { BOT, DB, PREFIX } from '@root/config';
import { staffPerms } from '@lib/permissions';
import { Message, MessageEmbed } from 'discord.js';
import { Command } from '@root/src/lib/types/Command';

export default class extends Command {

	description = `Reply to a question asked through ${BOT.NAME}.`;
	usage = '<questionID> <response>';
	extendedHelp = 'Responses get sent to the askers DMs. This command will tell you it failed if it cannot send the DM.';
	runInDM = false;
	aliases = ['sreply'];

	permissions(msg: Message): boolean {
		return staffPerms(msg);
	}

	async run(msg: Message, [question, response]: [PVQuestion, string]): Promise<Message> {
		if (question.type === 'private') {
			return msg.channel.send(`\`${PREFIX}sudoreply\` has been depreciated for private questions. Please reply in thread <#${question.threadId}>.`);
		}

		const asker = await msg.client.users.fetch(question.owner);
		const embed = new MessageEmbed()
			.setAuthor(`${msg.author.tag} replied to question ${question.questionId}`, msg.author.avatarURL())
			.setDescription(response)
			.setFooter(`To respond do \n${PREFIX}reply ${question.questionId} <response>`);

		return asker.send({ embeds: [embed] })
			.then(() => msg.channel.send(`I've sent your response to ${asker.username}.`))
			.catch(() => msg.channel.send(`I couldn't send your response. ${asker.username} may have DMs disabled.`));
	}

	async argParser(msg: Message, input: string): Promise<[PVQuestion, string]> {
		const question: PVQuestion = await msg.client.mongo.collection(DB.PVQ).findOne({ questionId: input.split(' ')[0] });

		if (!question) throw `Could not find question with an ID of **${input.split(' ')[0]}**.`;

		return [question, input.slice(question.questionId.length).trim()];
	}

}
