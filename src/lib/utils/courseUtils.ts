import { OverwriteResolvable, Guild, TextChannel, ChatInputCommandInteraction, ChannelType } from 'discord.js';
import { Course } from '@lib/types/Course';
import { DB, GUILDS, ROLES } from '@root/config';
import { updateDropdowns } from '@lib/utils/generalUtils';

// serializes course creation within the bot process so two concurrent commands can't create the same course twice
const coursesInCreation = new Set<string>();

export async function createCourse(interaction: ChatInputCommandInteraction, course: string): Promise<Course> {
	if (coursesInCreation.has(course)) {
		throw `Course ${course} is already being created by another command run.`;
	}
	coursesInCreation.add(course);
	try {
		return await buildCourse(interaction, course);
	} finally {
		coursesInCreation.delete(course);
	}
}

async function buildCourse(interaction: ChatInputCommandInteraction, course: string): Promise<Course> {
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
	const generalChannel = await createTextChannel(interaction.guild, `${course}_general`, standardPerms, categoryChannel.id, reason);
	await createTextChannel(interaction.guild, `${course}_homework`, standardPerms, categoryChannel.id, reason);
	await createTextChannel(interaction.guild, `${course}_labs`, standardPerms, categoryChannel.id, reason);
	await createTextChannel(interaction.guild, `${course}_projects`, standardPerms, categoryChannel.id, reason);
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

	return newCourse;
}

async function createTextChannel(guild: Guild, name: string, permissionOverwrites: Array<OverwriteResolvable>, parent: string, reason: string): Promise<TextChannel> {
	return guild.channels.create({
		name,
		type: ChannelType.GuildText,
		parent,
		permissionOverwrites,
		reason
	});
}
