import { Message } from 'discord.js';
import { SageClient } from '@lib/types/SageClient';
import { Course } from '@lib/types/Course';

export const description = 'Tags the specified question using the given assignemnt ID, for the';
export const usage = '<messageLink>|<courseID>|<assignmentID>';
export const aliases = ['tagq'];

// never assume that students are not dumb

/* export async function run(msg: Message, [link, course, assignment]: [string, string, string]): Promise<Message> {

} */

export async function argParser(msg: Message, input: string): Promise<[string, string, string]> {
	const [link, course, assignment] = input.split('|');
	if (!link || !course || !assignment) {
		throw `Usage: ${usage}`;
	}

	const bot = msg.client as SageClient;

	const newLink = link.replace('canary.', '');
	const match = newLink.match(/https:\/\/discord\.com\/channels(\/(\d)+){3}/);
	if (!match[0]) {
		throw `<${newLink}> is not a valid Discord message link.`;
	}

	const entry: Course = await bot.mongo.collection('courses').findOne({ name: course });
	if (!entry) {
		throw `Could not find course: ${course}`;
	}

	if (!entry.assignments.includes(assignment)) {
		throw `Could not find assignment: ${assignment} in course: ${course}`;
	}

	return [match[0], course, assignment];
}
