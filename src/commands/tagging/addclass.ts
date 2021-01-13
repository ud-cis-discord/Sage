import { Message } from 'discord.js';
import { Course } from '@lib/types/Course';
import { adminPerms } from '@lib/permissions';

export const description = 'Adds a course ID to the database to be used for question and assignment tags.';
export const usage = '<course ID>';
export const runInDM = false;
export const aliases = ['addc'];

export function permissions(msg: Message): boolean {
	return adminPerms(msg);
}

export async function run(msg: Message, [course]: [string]): Promise<Message> {
	const newCourse: Course = { name: course, assignments: [] };
	await msg.client.mongo.collection('courses').insertOne(newCourse);
	return msg.channel.send(`Added course with ID ${course}`);
}

export function argParser(_msg: Message, input: string): Array<string> {
	if (input === '') {
		throw `Usage: ${usage}`;
	}

	return [input];
}
