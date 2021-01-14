import { BOT, MAINTAINERS, PREFIX } from '@root/config';
import { Course } from '@lib/types/Course';
import { SageUser } from '@lib/types/SageUser';
import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { PVQuestion } from '@lib/types/PVQuestion';

export const description = 'Send an anonymous question in your classes general channel.';
export const usage = '[course] <question>';
export const extendedHelp = `${BOT.NAME} will automaticly determine your course if you are only enrolled in one!`;
export const aliases = ['anon'];
export const runInGuild = false;

export async function run(msg: Message, [course, question]: [Course, string]): Promise<Message> {
	const questionId = `${msg.author.id.slice(msg.author.id.length - 4)}${msg.id.slice(msg.id.length - 4)}`;

	const studentEmbed = new MessageEmbed()
		.setAuthor(`Anonymous asked Question ${questionId}`)
		.setDescription(question);

	const generalChannel = await msg.client.channels.fetch(course.channels.general) as TextChannel;
	const questionMessage = await generalChannel.send(studentEmbed);
	const messageLink = `https://discord.com/channels/${questionMessage.guild.id}/${questionMessage.channel.id}/${questionMessage.id}`;

	const staffEmbed = new MessageEmbed()
		.setAuthor(`${msg.author.tag} (${msg.author.id}) asked Question ${questionId}`, msg.author.avatarURL())
		.setDescription(`[Click to jump](${messageLink})
It is recomended you reply in public, but sudoreply can be used **in a staff channel** to reply in private if nessary.`);

	const staffChannel = await msg.client.channels.fetch(course.channels.staff) as TextChannel;
	await staffChannel.send(staffEmbed);

	const entry: PVQuestion = {
		owner: msg.author.id,
		type: 'anonymous',
		questionId,
		messageLink
	};

	msg.client.mongo.collection('pvQuestions').insertOne(entry);

	return msg.channel.send(`Your question has been sent to your course anonymously. To reply anonymously, use \`${PREFIX}reply ${questionId} <responce>\`.`);
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
