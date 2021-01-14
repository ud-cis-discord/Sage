import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { Course } from '@lib/types/Course';
import { PVQuestion } from '@lib/types/PVQuestion';
import { SageUser } from '@lib/types/SageUser';
import { BOT, MAINTAINERS, PREFIX } from '@root/config';
import { generateQuestionId } from '@lib/utils';

export const description = 'Send a question to all course staff privatly.';
export const usage = '[course] <question>';
export const extendedHelp = `${BOT.NAME} will automaticly determine your course if you are only enrolled in one!`;
export const runInGuild = false;

export async function run(msg: Message, [course, question]: [Course, string]): Promise<Message> {
	const questionId = await generateQuestionId(msg);

	const embed = new MessageEmbed()
		.setAuthor(`${msg.author.tag} (${msg.author.id}) asked Question ${questionId}`, msg.author.avatarURL())
		.setDescription(question)
		.setFooter(`To respond to this question, use ${PREFIX}sudoreply ${questionId} <responce>`);

	const staffChannel = await msg.client.channels.fetch(course.channels.staff) as TextChannel;
	const questionMessage = await staffChannel.send(embed);
	const messageLink = `https://discord.com/channels/${questionMessage.guild.id}/${questionMessage.channel.id}/${questionMessage.id}`;

	const entry: PVQuestion = {
		owner: msg.author.id,
		type: 'private',
		questionId,
		messageLink
	};

	msg.client.mongo.collection('pvQuestions').insertOne(entry);

	return msg.channel.send(`Your question has been sent to the staff, any responces will be sent here. Question ID: ${questionId}`);
}

export async function argParser(msg: Message, input: string): Promise<[Course, string]> {
	const user: SageUser = await msg.client.mongo.collection('users').findOne({ discordId: msg.author.id });

	if (!user) throw `Something went wrong. Please contact ${MAINTAINERS}`;

	let course: Course;
	let question: string;
	const courses: Array<Course> = await msg.client.mongo.collection('courses').find().toArray();

	if (user.courses.length === 1) {
		course = courses.find(c => c.name === user.courses[0]);
		if (input.startsWith(course.name)) {
			question = input.slice(course.name.length).trim();
		} else {
			question = input;
		}
	} else {
		const inputedCourse = courses.find(c => c.name === input.split(' ')[0]);
		if (!inputedCourse) {
			throw `I wasn't able to determine your course baised off of your enrollment or your input. Please specify the corse at the begining of your question.
Avaliable corses: \`${courses.map(c => c.name).join('`, `')}\``;
		}
		course = inputedCourse;
		question = input.slice(course.name.length).trim();
	}

	return [course, question];
}
