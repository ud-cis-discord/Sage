// import { PVQuestion } from '@lib/types/PVQuestion';
// import { BOT, DB, PREFIX } from '@root/config';
// import { Command } from '@lib/types/Command';
// import { MessageEmbed, Message, TextChannel, MessageAttachment } from 'discord.js';


// export default class extends Command {

// 	description = `Reply to a question you previously asked with ${BOT.NAME}.`;
// 	usage = '<questionID> <response>';
// 	runInGuild = false;

// 	async run(msg: Message, [question, response]: [PVQuestion, string]): Promise<Message> {
// 		if (question.type === 'private') {
// 			const splitLink = question.messageLink.split('/');
// 			const threadId = splitLink[splitLink.length - 2];
// 			return msg.channel.send(`\`${PREFIX}reply\` has been deprecated for private questions. Please reply in thread <#${threadId}>.`);
// 		}
// 		const [, channelId] = question.messageLink.match(/\d\/(\d+)\//);
// 		const channel = await msg.client.channels.fetch(channelId) as TextChannel;

// 		const embed = new MessageEmbed()
// 			.setAuthor(`Anonymous responded to ${question.questionId}`, msg.client.user.avatarURL())
// 			.setDescription(`${response}\n\n[Jump to question](${question.messageLink})`);

// 		const attachments: MessageAttachment[] = [];


// 		return channel.send({ embeds: [embed], files: attachments })
// 			.then(() => msg.channel.send('I\'ve forwarded your message along.'));
// 	}

// 	async argParser(msg: Message, input: string): Promise<[PVQuestion, string]> {
// 		const question: PVQuestion = await msg.client.mongo.collection(DB.PVQ).findOne({ questionId: input.split(' ')[0] });

// 		if (!question) throw `Could not find question with an ID of **${input.split(' ')[0]}**.`;
// 		if (question.owner !== msg.author.id) throw `You are not the owner of ${question.questionId}.`;

// 		return [question, input.slice(question.questionId.length).trim()];
// 	}

// }
