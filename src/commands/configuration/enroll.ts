import { Message } from 'discord.js';
import { Course } from '@lib/types/Course';
import { SageUser } from '@lib/types/SageUser';

export const description = 'Enroll yourself in a course.';
export const usage = '<course>';
export const extendedHelp = 'If you use this command on a course you are already enrolled in, you will be unenrolled.';
export const runInDM = false;

export async function run(msg: Message, [desiredCourse]: [string]): Promise<Message> {
	const courses: Array<Course> = await msg.client.mongo.collection('courses').find().toArray();
	const course = courses.find(c => c.name === desiredCourse);

	if (!course) {
		return msg.channel.send(`Could not find course: ${desiredCourse}.\nAvaliable courses: \`${courses.map(c => c.name).join('`, `')}\``);
	}

	const user: SageUser = await msg.client.mongo.collection('users').findOne({ discordId: msg.member.id });
	const enroll = !user.courses.includes(course.name);

	if (enroll) {
		user.courses.push(course.name);
		msg.member.roles.add(course.roles.student, `Enrolled in ${course.name}.`);
	} else {
		user.courses = user.courses.filter(c => c !== course.name);
		msg.member.roles.remove(course.roles.student, `Unenrolled from ${course.name}.`);
	}

	msg.client.mongo.collection('users').updateOne({ discordId: msg.member.id }, { $set: { ...user } });

	return msg.channel.send(`You have been ${enroll ? 'enrolled in' : 'unenrolled from'} ${course.name}.`);
}

export async function argParser(_msg: Message, input: string): Promise<Array<string>> {
	if (input === '') throw `Usage: ${usage}`;
	return [input];
}
