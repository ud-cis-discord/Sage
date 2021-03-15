import { Message, TextChannel } from 'discord.js';
import { Course } from '@lib/types/Course';
import { QuestionTag } from '@root/src/lib/types/QuestionTag';
import { DB } from '@root/config';

export const description = 'Tags the specified message with a given course and assignment ID.';
export const extendedHelp = 'This command must be used by replying to a message.';
export const usage = '<assignmentID>';
export const runInDM = false;
export const aliases = ['tagq', 'tag'];

// never assume that students are not dumb

export async function run(msg: Message, [messageLink, courseId, assignmentId]: [string, string, string]): Promise<Message> {
	const entry = await msg.client.mongo.collection(DB.QTAGS).findOne({ link: messageLink, course: courseId, assignment: assignmentId });

	if (entry) {
		return msg.channel.send(`That message has already been tagged for ${assignmentId}`);
	}

	const [guildId, channelId, messageId] = messageLink.match(/(\d)+/g);
	const channel = msg.client.guilds.cache.get(guildId).channels.cache.get(channelId) as TextChannel;
	const question = await channel.messages.fetch(messageId);

	if (!question) {
		return msg.channel.send('I couldn\'t find a message with that message link.');
	}

	const newQuestion: QuestionTag = {
		link: messageLink,
		course: courseId,
		assignment: assignmentId,
		header: question.cleanContent.length < 200 ? question.cleanContent : `${question.cleanContent.slice(0, 200)}...`
	};

	msg.client.mongo.collection(DB.QTAGS).insertOne(newQuestion);
	msg.channel.send('Added that message to the database.');
}

export async function argParser(msg: Message, input: string): Promise<[string, string, string]> {
	if (input === '' || !msg.reference) throw `Usage: ${usage}\n${extendedHelp}`;

	const link = `https://discord.com/channels/${msg.reference.guildID}/${msg.reference.channelID}/${msg.reference.messageID}`;
	const assignment = input.trim();

	if (!('parentID' in msg.channel)) throw 'This command is only available in Text channels.';
	const course: Course = await msg.client.mongo.collection(DB.COURSES).findOne({ 'channels.category': msg.channel.parentID });

	if (!course) throw 'This command must be run in a class specific channel';

	if (!course.assignments.includes(assignment)) {
		throw `Could not find assignment **${assignment}** in course: **${course.name}**.\n` +
		`CISC ${course.name} currently has these assignments: ${course.assignments.length > 0
			? `\`${course.assignments.join('`, `')}\``
			: 'It looks like there aren\'t any yet, ask a staff member to add some.'}`;
	}

	return [link, course.name, assignment];
}
