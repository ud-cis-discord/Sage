import { ApplicationCommandOptionData, CommandInteraction, GuildChannel, MessageEmbed, TextChannel, ThreadChannel } from 'discord.js';
import { Course } from '@lib/types/Course';
import { PVQuestion } from '@lib/types/PVQuestion';
import { SageUser } from '@lib/types/SageUser';
import { BOT, DB, MAINTAINERS, ROLES } from '@root/config';
import { generateErrorEmbed, generateQuestionId } from '@lib/utils';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Send a question to all course staff privately.';
	extendedHelp = `${BOT.NAME} will automatically determine your course if you are only enrolled in one!`;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'question',
			description: 'What you would like to ask',
			type: 'STRING',
			required: true
		},
		{
			name: 'course',
			description: 'What course chat would you like to ask your question in?',
			type: 'STRING',
			required: false
		}
	]

	async run(interaction: CommandInteraction): Promise<void> {
		const user: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: interaction.user.id });

		if (!user) {
			return interaction.reply({ embeds: [generateErrorEmbed(`Something went wrong. Please contact ${MAINTAINERS}`)], ephemeral: true });
		}

		let course: Course;
		const question = interaction.options.getString('question');
		const courses: Array<Course> = await interaction.client.mongo.collection(DB.COURSES).find().toArray();

		if (user.courses.length === 1) {
			course = courses.find(c => c.name === user.courses[0]);
		} else {
			const inputtedCourse = courses.find(c => c.name === interaction.options.getString('course'));
			if (!inputtedCourse) {
				const desc = 'I wasn\'t able to determine your course based off of your enrollment or your input. Please specify the course at the beginning of your question.' +
				`\nAvailable courses: \`${courses.map(c => c.name).sort().join('`, `')}\``;
				return interaction.reply({ embeds: [generateErrorEmbed(desc)], ephemeral: true });
			}
			course = inputtedCourse;
		}

		if (!question) {
			return interaction.reply({ embeds: [generateErrorEmbed('Please provide a question.')], ephemeral: true });
		}

		const bot = interaction.client;
		const questionId = await generateQuestionId(interaction);

		console.log(course.name);
		console.log(course.channels.general);

		const courseGeneral = (await bot.channels.fetch(course.channels.general)) as GuildChannel;
		let privThread: ThreadChannel;
		if (courseGeneral.isText()) {
			privThread = await courseGeneral.threads.create({
				name: `${interaction.user.username}‘s private question (${questionId})`,
				autoArchiveDuration: 4320,
				reason: `${interaction.user.username} asked a private question`
			});
		} else {
			throw `Something went wrong creating ${interaction.user.username}'s private thread. Please contact ${MAINTAINERS} for assistance!'`;
		}

		privThread.guild.members.fetch();
		privThread.guild.members.cache.filter(mem => mem.roles.cache.has(course.roles.staff)
		).forEach(staff => {
			privThread.members.add(staff);
		});
		privThread.members.add(interaction.user.id);

		const embed = new MessageEmbed()
			.setAuthor(`${interaction.user.tag} (${interaction.user.id}) asked Question ${questionId}`, interaction.user.avatarURL())
			.setDescription(`${question}\n\n To respond to this question, reply in this thread: <#${privThread.id}>`);

		const privateChannel = await interaction.client.channels.fetch(course.channels.private) as TextChannel;
		await privateChannel.send({
			embeds: [embed]
		});

		embed.setDescription(question);
		embed.setTitle(`${interaction.user.username}'s Question`);
		embed.setFooter(`When you're done with this question, you can send \`/archive\` to close it`);
		const questionMessage = await privThread.send({
			embeds: [embed]
		});
		const messageLink = `https://discord.com/channels/${questionMessage.guild.id}/${questionMessage.channel.id}/${questionMessage.id}`;

		const entry: PVQuestion = {
			owner: interaction.user.id,
			type: 'private',
			questionId,
			messageLink
		};

		interaction.client.mongo.collection(DB.PVQ).insertOne(entry);

		return interaction.reply({ content: `Your question has been sent to the staff. Any conversation about it will be had here: <#${privThread.id}>`, ephemeral: true });
	}

}
