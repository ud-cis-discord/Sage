import { PVQuestion } from '@lib/types/PVQuestion';
import { BOT, DB, PREFIX } from '@root/config';
import { Command } from '@lib/types/Command';
import { MessageEmbed, Message, TextChannel } from 'discord.js';

export const description = `Reply to a question you previously asked with ${BOT.NAME}.`;
export const usage = '<questionID> <response>';
export const runInGuild = false;

export default class extends Command {

	async run(msg: Message, [question, response]: [PVQuestion, string]): Promise<Message> {
		const [, channelId] = question.messageLink.match(/\d\/(\d+)\//);
		const channel = await msg.client.channels.fetch(channelId) as TextChannel;

		const shownAuthor = question.type === 'private' ? msg.author.tag : 'Anonymous';
		const shownAvatar = question.type === 'private' ? msg.author.avatarURL() : null;

		const embed = new MessageEmbed()
			.setAuthor(`${shownAuthor} responded to ${question.questionId}`, shownAvatar)
			.setDescription(`${response}\n\n[Jump to question](${question.messageLink})`);

		if (question.type === 'private') {
			embed.setFooter(`To respond to this question use: \n${PREFIX}sudoreply ${question.questionId} <response>`);

			if (msg.attachments) {
				let imageSet = false;
				msg.attachments.forEach(attachment => {
					if (!imageSet && attachment.height) {
						embed.setImage(attachment.url);
						imageSet = true;
					} else {
						embed.attachFiles([attachment]);
					}
				});
			}
		}

		return channel.send({ embeds: [embed] })
			.then(() => msg.channel.send('I\'ve forwarded your message along.'));
	}

	async argParser(msg: Message, input: string): Promise<[PVQuestion, string]> {
		const question: PVQuestion = await msg.client.mongo.collection(DB.PVQ).findOne({ questionId: input.split(' ')[0] });

		if (!question) throw `Could not find question with an ID of **${input.split(' ')[0]}**.`;
		if (question.owner !== msg.author.id) throw `You are not the owner of ${question.questionId}.`;

		return [question, input.slice(question.questionId.length).trim()];
	}

}
