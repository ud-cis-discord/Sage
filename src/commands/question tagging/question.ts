import { EmbedField, Message, MessageEmbed } from 'discord.js';
import { Course } from '@lib/types/Course';
import { DB, PREFIX } from '@root/config';
import { QuestionTag } from '@root/src/lib/types/QuestionTag';

export const description = 'Filters the questionTags collection for a given class and assignment';
export const usage = '<courseID>|<assignmentID>';
export const aliases = ['q'];

// never assume that students are not dumb

export async function run(msg: Message, [course, assignment]: [string, string]): Promise<Message> {
	const entries: Array<QuestionTag> = await msg.client.mongo.collection(DB.QTAGS).find({ course: course, assignment: assignment }).toArray();
	const fields: Array<EmbedField> = [];
	if (entries.length === 0) {
		return msg.channel.send(`There are no questions for ${course}, ${assignment}.
	To add questions, use the tag command (\`${PREFIX}help tag\`)`.replace('\t', ''));
	}
	entries.forEach(doc => {
		fields.push({ name: doc.header.replace(/\n/g, ' '), value: `[Click to view](${doc.link})`, inline: false });
	});
	const embeds: Array<MessageEmbed> = [new MessageEmbed()
		.setTitle(`Questions for ${course} ${assignment}`)
		.addFields(fields.splice(0, 25))
		.setColor('DARK_AQUA')];

	while (fields.length > 0) {
		embeds.push(new MessageEmbed()
			.addFields(fields.splice(0, 25))
			.setColor('DARK_AQUA'));
	}

	let failed = false;
	for (const embed of embeds) {
		await msg.author.send(embed)
			.catch(async () => {
				await msg.channel.send('I couldn\'t send you a DM. Please enable DMs and try again');
				failed = true;
			});
		if (failed) {
			break;
		}
	}
	if (!failed) {
		return msg.channel.send('I\'ve sent the list to your DMs.');
	}
}

export async function argParser(msg: Message, input: string): Promise<[string, string]> {
	const [course, assignment] = input.split('|').map(arg => arg.trim());
	if (!course || !assignment) {
		throw `Usage: ${usage}`;
	}

	const entry: Course = await msg.client.mongo.collection(DB.COURSES).findOne({ name: course });
	if (!entry) {
		throw `Could not find course: **${course}**`;
	}

	if (!entry.assignments.includes(assignment)) {
		throw `Could not find assignment **${assignment}** in course: **${course}**.\n` +
		`${course} currently has these assignments:\n\`${entry.assignments.join('`, `')}\``;
	}

	return [course, assignment];
}
