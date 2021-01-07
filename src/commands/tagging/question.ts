import { EmbedField, Message, MessageEmbed } from 'discord.js';
import { SageClient } from '@lib/types/SageClient';
import { Course } from '@lib/types/Course';
import { PREFIX } from '@root/config';
import { Question } from '@lib/types/Question';

export const description = 'Filters the questionTags collection for a given class and assignment';
export const usage = '<courseID>|<assignmentID>';
export const aliases = ['q'];

// never assume that students are not dumb

export async function run(msg: Message, [course, assignment]: [string, string]): Promise<Message> {
	const bot = msg.client as SageClient;
	const entries: Array<Question> = await bot.mongo.collection('questions').find({ course: course, assignment: assignment }).toArray();
	const fields: Array<EmbedField> = [];
	if (entries.length === 0) {
		return msg.channel.send(`There are no questions for ${course}, ${assignment}.
	To add questions, use the tag command (\`${PREFIX}help tag\`)`.replace('\t', ''));
	}
	entries.forEach(doc => {
		fields.push({ name: doc.header, value: `[Click to view](${doc.link})`, inline: true });
	});
	const embed = new MessageEmbed()
		.setTitle(`Questions for ${course} ${assignment}`)
		.addFields(fields)
		.setColor('DARK_AQUA');

	return msg.channel.send(embed);
}

export async function argParser(msg: Message, input: string): Promise<[string, string]> {
	const [course, assignment] = input.split('|').map(arg => arg.trim());
	if (!course || !assignment) {
		throw `Usage: ${usage}`;
	}

	const bot = msg.client as SageClient;

	const entry: Course = await bot.mongo.collection('courses').findOne({ name: course });
	if (!entry) {
		throw `Could not find course: **${course}**`;
	}

	if (!entry.assignments.includes(assignment)) {
		throw `Could not find assignment **${assignment}** in course: **${course}**.\n${course} curently has these assignments:\n\`${entry.assignments.join('`, `')}\``;
	}

	return [course, assignment];
}
