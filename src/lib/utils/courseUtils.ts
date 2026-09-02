import { OverwriteResolvable, Guild, TextChannel, ChatInputCommandInteraction, ChannelType } from 'discord.js';
import { Course } from '@lib/types/Course';
import { DB, GUILDS, ROLES } from '@root/config';
import { updateDropdowns } from '@lib/utils/generalUtils';

// serializes course creation within the bot process so two concurrent commands can't create the same course twice
const coursesInCreation = new Set<string>();

export const DEFAULT_ASSIGNMENTS = ['hw1', 'hw2', 'hw3', 'hw4', 'hw5', 'lab1', 'lab2', 'lab3', 'lab4', 'lab5'];

//	any command that creates or adopts a course runs its writes through here, so /addcourse and /registercourse
//	can't work on the same course at the same time
export async function withCourseLock<T>(course: string, work: () => Promise<T>): Promise<T> {
	if (coursesInCreation.has(course)) {
		throw `Course ${course} is already being created by another command run.`;
	}
	coursesInCreation.add(course);
	try {
		return await work();
	} finally {
		coursesInCreation.delete(course);
	}
}

//	the access every course channel grants: staffPerms leaves students out, standardPerms lets them in
export function getCoursePerms(staffRoleId: string, studentRoleId: string): { standardPerms: OverwriteResolvable[], staffPerms: OverwriteResolvable[] } {
	const standardPerms: Array<OverwriteResolvable> = [{
		id: ROLES.ADMIN,
		allow: 'ViewChannel'
	}, {
		id: staffRoleId,
		allow: 'ViewChannel'
	}, {
		id: GUILDS.MAIN,
		deny: 'ViewChannel'
	}, {
		id: studentRoleId,
		allow: 'ViewChannel'
	}, {
		id: ROLES.MUTED,
		deny: 'SendMessages'
	}];
	return { standardPerms, staffPerms: [standardPerms[0], standardPerms[1], standardPerms[2]] };
}

//	A record whose category is gone is dead: nobody is really enrolled and its roles grant access to nothing.
//	Roles the caller is about to reuse are named in keepRoleIds. Returns the names of the roles it deleted.
export async function clearStaleCourse(interaction: ChatInputCommandInteraction, stale: Course,
	keepRoleIds: Set<string> = new Set()): Promise<string[]> {
	const courses = interaction.client.mongo.collection(DB.COURSES);
	await courses.deleteOne({ name: stale.name });
	await interaction.client.mongo.collection(DB.USERS).updateMany({}, { $pull: { courses: stale.name } });

	const deleted: string[] = [];
	for (const roleId of [stale.roles?.staff, stale.roles?.student]) {
		//	going by the IDs on the record, never by name, so a role belonging to some other course is never caught
		//	up in this
		if (!roleId || keepRoleIds.has(roleId)) continue;
		const role = interaction.guild.roles.cache.get(roleId);
		if (!role) continue;
		if (await courses.countDocuments({ $or: [{ 'roles.staff': roleId }, { 'roles.student': roleId }] }) > 0) continue;
		try {
			await role.delete(`Clearing the leftover record for course ${stale.name}.`);
			deleted.push(role.name);
		} catch (error) {
			//	a role too high in the list to delete shouldn't stop the course being rebuilt
			interaction.client.emit('error', error);
		}
	}
	return deleted;
}

export async function createCourse(interaction: ChatInputCommandInteraction, course: string): Promise<Course> {
	return withCourseLock(course, () => buildCourse(interaction, course));
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
	const { standardPerms, staffPerms } = getCoursePerms(staffRole.id, studentRole.id);

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
		assignments: [...DEFAULT_ASSIGNMENTS]
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
