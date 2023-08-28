import { OverwriteResolvable, Guild, TextChannel, ApplicationCommandPermissions, ChatInputCommandInteraction, ApplicationCommandOptionData, ApplicationCommandOptionType,
	InteractionResponse, ChannelType } from 'discord.js';
import { Course } from '@lib/types/Course';
import { ADMIN_PERMS } from '@lib/permissions';
import { DB, GUILDS, ROLES } from '@root/config';
import { Command } from '@lib/types/Command';
import { updateDropdowns } from '@lib/utils/generalUtils';

export default class extends Command {

	description = 'Creates a courses category and adds all necessary channels/roles.';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'course',
		description: 'The three-digit course ID of the course to be added (ex: 108).',
		type: ApplicationCommandOptionType.String,
		required: true
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		interaction.reply('<a:loading:755121200929439745> working...');

		const course = interaction.options.getString('course');
		//	make sure course does not exist already
		if (await interaction.client.mongo.collection(DB.COURSES).countDocuments({ name: course }) > 0) {
			interaction.editReply({ content: `${course} has already been registered as a course.` });
		}
		const reason = `Creating new course \`${course}\` as requested 
		by \`${interaction.user.username}\` \`(${interaction.user.id})\`.`;

		//	create staff role for course
		const staffRole = await interaction.guild.roles.create({
			name: `${course} Staff`,
			permissions: BigInt(0),
			mentionable: true,
			reason: reason
		});

		//	create student role for course
		const studentRole = await interaction.guild.roles.create({
			name: `CISC ${course}`,
			permissions: BigInt(0),
			reason: reason
		});

		//	set permissions for the course
		const standardPerms: Array<OverwriteResolvable> = [{
			id: ROLES.ADMIN,
			allow: 'ViewChannel'
		}, {
			id: staffRole.id,
			allow: 'ViewChannel'
		}, {
			id: GUILDS.MAIN,
			deny: 'ViewChannel'
		}, {
			id: studentRole.id,
			allow: 'ViewChannel'
		}, {
			id: ROLES.MUTED,
			deny: 'SendMessages'
		}];
		const staffPerms = [standardPerms[0], standardPerms[1], standardPerms[2]];

		//	create course category
		const categoryChannel = await interaction.guild.channels.create({
			name: `CISC ${course}`,
			type: ChannelType.GuildCategory,
			permissionOverwrites: standardPerms,
			reason
		});

		//	create each channel in the category
		const generalChannel = await this.createTextChannel(interaction.guild, `${course}_general`, standardPerms, categoryChannel.id, reason);
		await this.createTextChannel(interaction.guild, `${course}_homework`, standardPerms, categoryChannel.id, reason);
		await this.createTextChannel(interaction.guild, `${course}_labs`, standardPerms, categoryChannel.id, reason);
		await this.createTextChannel(interaction.guild, `${course}_projects`, standardPerms, categoryChannel.id, reason);
		const staffChannel = await interaction.guild.channels.create({
			name: `${course}_staff`,
			type: ChannelType.GuildText,
			parent: categoryChannel.id,
			topic: '[no message count]',
			permissionOverwrites: staffPerms,
			reason
		});
		const privateQuestionChannel = await interaction.guild.channels.create({
			name: `${course}_private_qs`,
			type: ChannelType.GuildText,
			parent: categoryChannel.id,
			topic: '[no message count]',
			permissionOverwrites: staffPerms,
			reason
		});

		//	adding the course to the database
		const newCourse: Course = {
			name: course,
			channels: {
				category: categoryChannel.id,
				general: generalChannel.id,
				staff: staffChannel.id,
				private: privateQuestionChannel.id
			},
			roles: {
				staff: staffRole.id,
				student: studentRole.id
			},
			assignments: ['hw1', 'hw2', 'hw3', 'hw4', 'hw5', 'lab1', 'lab2', 'lab3', 'lab4', 'lab5']
		};
		await interaction.client.mongo.collection(DB.COURSES).insertOne(newCourse);

		await updateDropdowns(interaction);

		interaction.editReply(`Successfully added course with ID ${course}`);
	}

	async createTextChannel(guild: Guild, name: string, permissionOverwrites: Array<OverwriteResolvable>, parent: string, reason: string): Promise<TextChannel> {
		return guild.channels.create({
			name,
			type: ChannelType.GuildText,
			parent,
			permissionOverwrites,
			reason
		});
	}

}
