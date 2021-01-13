import { Message, OverwriteResolvable, Guild, TextChannel } from 'discord.js';
import { Course } from '@lib/types/Course';
import { adminPerms } from '@lib/permissions';
import { GUILDS, ROLES } from '@root/config';

export const description = 'Creates a corses category and adds all nessary channels/roles.';
export const usage = '<course ID>';
export const runInDM = false;
export const aliases = ['addc', 'createcourse', 'createc'];

export function permissions(msg: Message): boolean {
	return adminPerms(msg);
}

export async function run(msg: Message, [course]: [string]): Promise<Message> {
	const response = msg.channel.send('<a:loading:755121200929439745> working...');

	const reason = `Creating new course ${course} as requested by ${msg.author.username} (${msg.author.id}).`;
	const staffRole = await msg.guild.roles.create({
		data: {
			name: `${course} Staff`,
			permissions: 0,
			mentionable: true
		},
		reason
	});
	const studentRole = await msg.guild.roles.create({ data: { name: `CISC ${course}`, permissions: 0 }, reason });

	const standardPerms: Array<OverwriteResolvable> = [{
		id: staffRole.id,
		allow: 'VIEW_CHANNEL'
	}, {
		id: GUILDS.MAIN,
		deny: 'VIEW_CHANNEL'
	}, {
		id: studentRole.id,
		allow: 'VIEW_CHANNEL'
	}, {
		id: ROLES.MUTED,
		deny: 'SEND_MESSAGES'
	}];

	const categoryChannel = await msg.guild.channels.create(`CISC ${course}`, {
		type: 'category',
		permissionOverwrites: standardPerms,
		reason
	});
	const generalChannel = await createTextChannel(msg.guild, `${course}_general`, standardPerms, categoryChannel.id, reason);
	await createTextChannel(msg.guild, `${course}_homework`, standardPerms, categoryChannel.id, reason);
	await createTextChannel(msg.guild, `${course}_labs`, standardPerms, categoryChannel.id, reason);
	await createTextChannel(msg.guild, `${course}_projects`, standardPerms, categoryChannel.id, reason);
	const staffChannel = await msg.guild.channels.create(`${course}_staff`, {
		type: 'text',
		parent: categoryChannel.id,
		topic: '[no message count]',
		permissionOverwrites: standardPerms.splice(0, 2),
		reason
	});

	const newCourse: Course = {
		name: course,
		channels: {
			category: categoryChannel.id,
			general: generalChannel.id,
			staff: staffChannel.id
		},
		roles: {
			staff: staffRole.id,
			student: studentRole.id
		},
		assignments: []
	};
	await msg.client.mongo.collection('courses').insertOne(newCourse);
	return (await response).edit(`Added course with ID ${course}`);
}

export async function argParser(msg: Message, input: string): Promise<Array<string>> {
	if (input === '') {
		throw `Usage: ${usage}`;
	}

	if (await msg.client.mongo.collection('courses').countDocuments({ name: input }) > 0) {
		throw `${input} has already been regestered as a course.`;
	}

	return [input];
}

async function createTextChannel(guild: Guild, name: string, permissionOverwrites: Array<OverwriteResolvable>, parent: string, reason: string): Promise<TextChannel> {
	return guild.channels.create(name, {
		type: 'text',
		parent,
		permissionOverwrites,
		reason
	});
}
