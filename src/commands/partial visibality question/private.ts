import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { Course } from '@lib/types/Course';
import { PVQuestion } from '@lib/types/PVQuestion';
import { SageUser } from '@lib/types/SageUser';
import { BOT, DB, MAINTAINERS, PREFIX } from '@root/config';
import { generateQuestionId } from '@lib/utils';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Send a question to all course staff privately.';
	usage = '[course] <question>';
	extendedHelp = `${BOT.NAME} will automatically determine your course if you are only enrolled in one!`;
	runInGuild = false;

	async run(msg: Message, [course, question]: [Course, string]): Promise<Message> {
		const questionId = await generateQuestionId(msg);

		const embed = new MessageEmbed()
			.setAuthor(`${msg.author.tag} (${msg.author.id}) asked Question ${questionId}`, msg.author.avatarURL())
			.setDescription(question)
			.setFooter(`To respond to this question use: \n${PREFIX}sudoreply ${questionId} <response>`);
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

		const privateChannel = await msg.client.channels.fetch(course.channels.private) as TextChannel;
		const questionMessage = await privateChannel.send({ embeds: [embed] });
		const messageLink = `https://discord.com/channels/${questionMessage.guild.id}/${questionMessage.channel.id}/${questionMessage.id}`;

		const entry: PVQuestion = {
			owner: msg.author.id,
			type: 'private',
			questionId,
			messageLink
		};

		msg.client.mongo.collection(DB.PVQ).insertOne(entry);

		return msg.channel.send(`Your question has been sent to the staff, any responses will be sent here. Question ID: ${questionId}`);
	}

	async argParser(msg: Message, input: string): Promise<[Course, string]> {
		const user: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });

		if (!user) throw `Something went wrong. Please contact ${MAINTAINERS}`;

		let course: Course;
		let question: string;
		const courses: Array<Course> = await msg.client.mongo.collection(DB.COURSES).find().toArray();

		if (user.courses.length === 1) {
			course = courses.find(c => c.name === user.courses[0]);
			if (input.startsWith(course.name)) {
				question = input.slice(course.name.length).trim();
			} else {
				question = input;
			}
		} else {
			const inputtedCourse = courses.find(c => c.name === input.split(' ')[0].toLowerCase());
			if (!inputtedCourse) {
				throw 'I wasn\'t able to determine your course biased off of your enrollment or your input. ' +
				`Please specify the course at the beginning of your question.\nAvailable courses: \`${courses.map(c => c.name).sort().join('`, `')}\``;
			}
			course = inputtedCourse;
			question = input.slice(course.name.length).trim();
		}

		if (!question) throw 'Please provide a question.';

		return [course, question];
	}

}
