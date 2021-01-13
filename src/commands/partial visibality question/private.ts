import { Course } from '@lib/types/Course';
import { MAINTAINERS } from '@root/config';
import { SageUser } from '@root/src/lib/types/SageUser';
import { Message } from 'discord.js';

export const runInGuild = false;

export function run(msg: Message, [course, question]: [Course, string]): Promise<Message> {
	return msg.channel.send(`Course: ${course.name}\nQuestion: ${question}`);
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
