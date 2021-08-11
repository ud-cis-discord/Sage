import { EmbedField, Message, MessageEmbed } from 'discord.js';
import { Course } from '@lib/types/Course';
import { QuestionTag } from '@lib/types/QuestionTag';
import { SageUser } from '@lib/types/SageUser';
import { BOT, DB, MAINTAINERS, PREFIX } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Filters the questionTags collection for a given class and assignment';
	extendedHelp = `${BOT.NAME} will automatically determine your course if you are only enrolled in one!`;
	usage = '[courseID] <assignmentID>';
	aliases = ['q'];

	// never assume that students are not dumb

	async run(msg: Message, [course, assignment]: [string, string]): Promise<Message> {
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
		if (!failed && msg.channel.type !== 'dm') {
			return msg.channel.send('I\'ve sent the list to your DMs.');
		}
	}

	async argParser(msg: Message, input: string): Promise<[string, string]> {
		const user: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });

		if (!user) throw `Something went wrong. Please contact ${MAINTAINERS}`;

		let course: Course;
		let assignment: string;
		const courses: Array<Course> = await msg.client.mongo.collection(DB.COURSES).find().toArray();

		if (user.courses.length === 1) {
			course = courses.find(c => c.name === user.courses[0]);
			if (input.startsWith(course.name)) {
				assignment = input.slice(course.name.length).trim();
			} else {
				assignment = input;
			}
		} else {
			const inputtedCourse = courses.find(c => c.name === input.split(' ')[0].toLowerCase());
			if (!inputtedCourse) {
				throw 'I wasn\'t able to determine your course based off of your enrollment or your input. Please specify the course at the beginning of your question.' +
				`\nAvailable courses: \`${courses.map(c => c.name).join('`, `')}\``;
			}
			course = inputtedCourse;
			assignment = input.slice(course.name.length).trim();
		}

		if (!course.assignments.includes(assignment)) {
			throw `I couldn't find an assignment called **${assignment}** for CISC ${course.name}\n` +
			`Assignments for CISC ${course.name}: ${course.assignments.length > 0 ? `\`${course.assignments.join('`, `')}\``
				: 'It looks like there aren\'t any yet, ask a staff member to add some.'}`;
		}
		return [course.name, assignment];
	}

}
