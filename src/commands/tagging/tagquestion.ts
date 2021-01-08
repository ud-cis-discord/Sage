import { Message, TextChannel } from 'discord.js';
import { Course } from '@lib/types/Course';
import { Question } from '@lib/types/Question';

export const description = 'Tags the specified message with a given course and assignment ID.';
export const usage = '<messageLink>|<courseID>|<assignmentID>';
export const aliases = ['tagq', 'tag'];

// never assume that students are not dumb

export async function run(msg: Message, [messageLink, courseId, assignmentId]: [string, string, string]): Promise<Message> {
	const entry = await msg.client.mongo.collection('questions').findOne({ link: messageLink, course: courseId, assignment: assignmentId });

	if (entry) {
		return msg.channel.send(`That message has already been tagged for ${assignmentId}`);
	}

	const [guildId, channelId, messageId] = messageLink.match(/(\d)+/g);
	const channel = msg.client.guilds.cache.get(guildId).channels.cache.get(channelId) as TextChannel;
	const question = await channel.messages.fetch(messageId);

	if (!question) {
		return msg.channel.send('I couldnt find a message with that message link.');
	}

	const newQuestion: Question = {
		link: messageLink,
		course: courseId,
		assignment: assignmentId,
		header: question.cleanContent.length < 200 ? question.cleanContent : `${question.cleanContent.slice(0, 200)}...`
	};

	msg.client.mongo.collection('questions').insertOne(newQuestion);
	msg.channel.send('Added that message to the database.');
}

export async function argParser(msg: Message, input: string): Promise<[string, string, string]> {
	const [link, course, assignment] = input.split('|').map(arg => arg.trim());
	if (!link || !course || !assignment) {
		throw `Usage: ${usage}`;
	}

	const newLink = link.replace('canary.', '');
	const match = newLink.match(/https:\/\/discord\.com\/channels(\/(\d)+){3}/);

	if (!match) {
		throw `**${newLink}** is not a valid Discord message link.`;
	}

	const entry: Course = await msg.client.mongo.collection('courses').findOne({ name: course });
	if (!entry) {
		throw `Could not find course: **${course}**`;
	}

	if (!entry.assignments.includes(assignment)) {
		throw `Could not find assignment **${assignment}** in course: **${course}**.\n${course} curently has these assignments:\n\`${entry.assignments.join('`, `')}\``;
	}

	return [match[0], course, assignment];
}
