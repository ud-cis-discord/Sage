import { PVQuestion } from '@lib/types/PVQuestion';
import { BOT, DB, MAINTAINERS } from '@root/config';
import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { ApplicationCommandOptionData, ApplicationCommandPermissions, ChatInputCommandInteraction, GuildChannel, Message, EmbedBuilder, TextChannel, ThreadChannel,
	ApplicationCommandOptionType, ChannelType, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';
import { Course } from '@lib/types/Course';

export default class extends Command {

	description = `Reply to a question asked through ${BOT.NAME}.`;
	extendedHelp = 'Responses are put into a private thread between you and the asker.';
	runInDM = false;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'questionid',
			description: 'ID of question you are replying to',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'response',
			description: 'Response to the question',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	]
	permissions: ApplicationCommandPermissions[] = [STAFF_PERMS, ADMIN_PERMS];

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void | Message<boolean>> {
		const idArg = interaction.options.getString('questionid');
		if (isNaN(Number.parseInt(idArg))) return interaction.reply({ content: `**${idArg}** is not a valid question ID`, ephemeral: true });

		const question: PVQuestion = await interaction.client.mongo.collection<PVQuestion>(DB.PVQ)
			.findOne({ questionId: `${interaction.options.getString('questionid')}` });
		if (!question) return interaction.reply({ content: `I could not find a question with ID **${idArg}**.`, ephemeral: true });

		const response = interaction.options.getString('response');
		const bot = interaction.client;
		const asker = await interaction.guild.members.fetch(question.owner);

		if (interaction.channel.type !== ChannelType.GuildText) {
			return interaction.reply({
				content: `You must use this command in a regular text channel. If you think there is a problem, please contact ${MAINTAINERS} for help.`,
				ephemeral: true
			});
		}

		const channel = interaction.channel as TextChannel;

		const course = await bot.mongo.collection<Course>(DB.COURSES).findOne({ 'channels.category': channel.parentId });

		if (question.type === 'private') {
			const splitLink = question.messageLink.split('/');
			const threadId = splitLink[splitLink.length - 2];
			return interaction.reply({
				content: `\`/sudoreply\` has been depreciated for private questions. Please reply in thread <#${threadId}>.`,
				ephemeral: true
			});
		}

		const courseGeneral = (await bot.channels.fetch(course.channels.general)) as GuildChannel;
		let privThread: ThreadChannel;
		if (courseGeneral.type === ChannelType.GuildText) {
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore
			privThread = await courseGeneral.threads.create({
				name: `${interaction.user.username}‘s anonymous question (${question.questionId})'`,
				autoArchiveDuration: 4320,
				reason: `${interaction.user.username} asked an anonymous question`,
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore
				type: `GUILD_PRIVATE_THREAD`
			});
		} else {
			throw `Something went wrong creating ${asker.user.username}'s private thread. Please contact ${MAINTAINERS} for assistance!'`;
		}

		privThread.guild.members.fetch();
		privThread.members.add(interaction.user.id);
		privThread.members.add(question.owner);

		const embed = new EmbedBuilder()
			.setDescription(`I've sent your response to this thread: <#${privThread.id}>\n\n Please have any further conversation there.`);

		await interaction.reply({
			embeds: [embed]
		});

		embed.setDescription(`${question.messageLink}`);
		embed.setTitle(`${asker.user.tag}'s Question`);
		embed.setFooter({ text: `When you're done with this question, you can send \`/archive\` to close it` });
		await privThread.send({
			embeds: [embed]
		});

		const threadEmbed = new EmbedBuilder()
			.setAuthor({ name: `${interaction.user.tag}`, iconURL: interaction.user.avatarURL() })
			.setDescription(response)
			.setFooter({ text: `Please have any further conversation in this thread!` });

		return privThread.send({ embeds: [threadEmbed] });
	}

}
