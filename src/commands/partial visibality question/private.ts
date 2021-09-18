import { GuildChannel, Message, MessageAttachment, MessageEmbed, TextChannel, ThreadChannel } from 'discord.js';
import { Course } from '@lib/types/Course';
import { PVQuestion } from '@lib/types/PVQuestion';
import { SageUser } from '@lib/types/SageUser';
import { BOT, DB, MAINTAINERS, PREFIX, ROLES } from '@root/config';
import { generateQuestionId } from '@lib/utils';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Send a question to all course staff privately.';
	usage = '[course] <question>';
	extendedHelp = `${BOT.NAME} will automatically determine your course if you are only enrolled in one!`;
	runInGuild = false;

	async run(msg: Message, [course, question]: [Course, string]): Promise<Message> {
		const bot = msg.client;
		const questionId = await generateQuestionId(msg);

		const courseGeneral = (await bot.channels.fetch(course.channels.general)) as GuildChannel;
		let privThread: ThreadChannel;
		if (courseGeneral.isText()) {
			privThread = await courseGeneral.threads.create({
				name: `${msg.author.username}‘s private question (${questionId})'`,
				autoArchiveDuration: 60,
				reason: `${msg.author.username} asked a private question`,
				type: `GUILD_PRIVATE_THREAD`
			});
		} else {
			throw `Something went wrong creating ${msg.author.username}'s private thread. Please contact ${MAINTAINERS} for assistance!'`;
		}

		privThread.guild.members.fetch();
		privThread.guild.members.cache.filter(mem => mem.roles.cache.has(ROLES.STUDENT_ADMIN || course.roles.staff)).forEach(user => {
			privThread.members.add(user);
		});
		privThread.members.add(msg.author.id);

		const embed = new MessageEmbed()
			.setAuthor(`${msg.author.tag} (${msg.author.id}) asked Question ${questionId}`, msg.author.avatarURL())
			.setDescription(`${question}\n\n To respond to this question, reply in this thread: <#${privThread.id}>`);

		const attachments: MessageAttachment[] = [];
		if (msg.attachments) {
			let imageSet = false;
			msg.attachments.forEach(attachment => {
				if (!imageSet && attachment.height) {
					embed.setImage(attachment.url);
					imageSet = true;
				} else {
					attachments.push(attachment);
				}
			});
		}

		const privateChannel = await msg.client.channels.fetch(course.channels.private) as TextChannel;
		await privateChannel.send({
			embeds: [embed],
			files: attachments
		});

		embed.setDescription(question);
		embed.setTitle(`${msg.author.username}'s Question`);
		embed.setFooter(`When you're done with this question, you can send \`${PREFIX}archive\` to close it`);
		const questionMessage = await privThread.send({
			embeds: [embed],
			files: attachments
		});
		const messageLink = `https://discord.com/channels/${questionMessage.guild.id}/${questionMessage.channel.id}/${questionMessage.id}`;

		const entry: PVQuestion = {
			owner: msg.author.id,
			type: 'private',
			questionId,
			messageLink
		};

		msg.client.mongo.collection(DB.PVQ).insertOne(entry);

		return msg.channel.send(`Your question has been sent to the staff. Any conversation about it will be had here: <#${privThread.id}>`);
	}

	async argParser(msg: Message, input: string): Promise<[Course, string]> {
		const user: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });

		if (!user) throw `Something went wrong. Please contact ${MAINTAINERS}`;

		let course: Course;
		let question: string;
		const courses: Array<Course> = await msg.client.mongo.collection(DB.COURSES).find().toArray();

		if (user.courses.length === 1) {
			course = courses.find(c => c.name === user.courses[0]);
			if (input.startsWith(course.name)) {
				question = input.slice(course.name.length).trim();
			} else {
				question = input;
			}
		} else {
			const inputtedCourse = courses.find(c => c.name === input.split(' ')[0].toLowerCase());
			if (!inputtedCourse) {
				throw 'I wasn\'t able to determine your course biased off of your enrollment or your input. ' +
				`Please specify the course at the beginning of your question.\nAvailable courses: \`${courses.map(c => c.name).sort().join('`, `')}\``;
			}
			course = inputtedCourse;
			question = input.slice(course.name.length).trim();
		}

		if (!question) throw 'Please provide a question.';

		return [course, question];
	}

}
