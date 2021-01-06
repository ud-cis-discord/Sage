import { Message } from 'discord.js';
import { SageClient } from '@lib/types/SageClient';
import { Course } from '@lib/types/Course';

export const description = 'Tags the specified question using the given assignemnt ID, for the;
export const usage = '<messageLink>|<courseID>|<assignmentID>';
export const aliases = ['tagq'];

// never assume that students are not dumb

export async function argParser(msg: Message, input: string): Promise<[string, string, string]> {
	let [link, course, assignment] = input.split('|');
	if (!link || !course || !assignment) {
		throw `Usage: ${usage}`;
	}

	link = link.replace('canary', '');
}
