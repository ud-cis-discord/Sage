import { ApplicationCommandOptionData, ApplicationCommandOptionType, ChatInputCommandInteraction, InteractionResponse, TextChannel } from 'discord.js';
import { Course } from '@lib/types/Course';
import { QuestionTag } from '@lib/types/QuestionTag';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';
import { generateErrorEmbed } from '@root/src/lib/utils/generalUtils';

export default class extends Command {

	description = 'Tags a message with a given course/assignment ID. Must be run in a class-specific channel.';
	options: ApplicationCommandOptionData[] = [
		{
			name: 'message',
			description: 'The link of the message you want to tag',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'assignmentid',
			description: 'The assignment name tag to add to this message',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	]

	// never assume that students are not dumb
	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const msgLink = interaction.options.getString('message');
		const assignmentId = interaction.options.getString('assignmentid');

		if (!('parentId' in interaction.channel)) return interaction.reply({ embeds: [generateErrorEmbed('This command is only available in text channels.')], ephemeral: true });
		// eslint-disable-next-line no-extra-parens
		const course: Course = await interaction.client.mongo.collection(DB.COURSES).findOne({ 'channels.category': interaction.channel.parentId });

		if (!course) return interaction.reply({ embeds: [generateErrorEmbed('This command must be run in a class specific channel')], ephemeral: true });

		if (!course.assignments.includes(assignmentId)) {
			const desc = `Could not find assignment **${assignmentId}** in course: **${course.name}**.\n` +
			`CISC ${course.name} currently has these assignments: ${course.assignments.length > 0
				? `\`${course.assignments.join('`, `')}\``
				: 'It looks like there aren\'t any yet, ask a staff member to add some.'}`;
			return interaction.reply({ embeds: [generateErrorEmbed(desc)], ephemeral: true });
		}

		const entry = await interaction.client.mongo.collection(DB.QTAGS).findOne({ link: msgLink, course: course.name, assignment: assignmentId });

		if (entry) return interaction.reply({ embeds: [generateErrorEmbed(`That message has already been tagged for ${assignmentId}`)], ephemeral: true });

		const [guildId, channelId, messageId] = msgLink.match(/(\d)+/g);
		const channel = interaction.client.guilds.cache.get(guildId).channels.cache.get(channelId) as TextChannel;
		const question = await channel.messages.fetch(messageId);

		if (!question) return interaction.reply({ embeds: [generateErrorEmbed('I couldn\'t find a message with that message link.')], ephemeral: true });

		let header: string;
		if (question.embeds[0]) {
			header = question.embeds[0].description;
		} else {
			header = question.cleanContent;
		}

		const newQuestion: QuestionTag = {
			link: msgLink,
			course: course.name,
			assignment: assignmentId,
			header: header.length < 200 ? header : `${header.slice(0, 200)}...`
		};

		interaction.client.mongo.collection(DB.QTAGS).insertOne(newQuestion);
		interaction.reply({ content: 'Added that message to the database.', ephemeral: true });
	}

}
