import { ApplicationCommandOptionData, ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, InteractionResponse, TextChannel } from 'discord.js';
import { generateErrorEmbed, generateQuestionId } from '@lib/utils/generalUtils';
import { Course } from '@lib/types/Course';
import { SageUser } from '@lib/types/SageUser';
import { PVQuestion } from '@lib/types/PVQuestion';
import { BOT, DB, MAINTAINERS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Send an anonymous question in your classes general channel.';
	extendedHelp = `${BOT.NAME} will automatically determine your course if you are only enrolled in one!`;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'question',
			description: 'What would you like to ask?',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'course',
			description: 'What course chat would you like to ask your question in?',
			type: ApplicationCommandOptionType.String,
			required: false
		},
		{
			name: 'file',
			description: 'A file to be posted with the question',
			type: ApplicationCommandOptionType.Attachment,
			required: false
		}
	]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const user: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: interaction.user.id });
		const file = interaction.options.getAttachment('file');

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

		const questionId = await generateQuestionId(interaction);

		const studentEmbed = new EmbedBuilder()
			.setAuthor({ name: `Anonymous asked Question ${questionId}`, iconURL: interaction.client.user.avatarURL() })
			.setDescription(question);

		if (file) studentEmbed.setImage(file.url);

		const generalChannel = await interaction.client.channels.fetch(course.channels.general) as TextChannel;
		const questionMessage = await generalChannel.send({ embeds: [studentEmbed] });
		const messageLink = `https://discord.com/channels/${questionMessage.guild.id}/${questionMessage.channel.id}/${questionMessage.id}`;

		const staffEmbed = new EmbedBuilder()
			.setAuthor({ name: `${interaction.user.tag} (${interaction.user.id}) asked Question ${questionId}`, iconURL: interaction.user.avatarURL() })
			.setDescription(`[Click to jump](${messageLink})
	It is recommended you reply in public, but sudoreply can be used **in a staff channel** to reply in private if necessary.`);

		const privateChannel = await interaction.client.channels.fetch(course.channels.private) as TextChannel;
		await privateChannel.send({ embeds: [staffEmbed] });

		const entry: PVQuestion = {
			owner: interaction.user.id,
			type: 'anonymous',
			questionId,
			messageLink
		};

		interaction.client.mongo.collection(DB.PVQ).insertOne(entry);

		return interaction.reply({ content: `Your question has been sent to your course anonymously. To reply anonymously, use \`/reply ${questionId} <response>\`.`, ephemeral: true });
	}

}
