import { Message, OverwriteResolvable, Guild, TextChannel } from 'discord.js';
import { Course } from '@lib/types/Course';
import { adminPerms } from '@lib/permissions';
import { DB, GUILDS, ROLES } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Creates a courses category and adds all necessary channels/roles.';
	usage = '<course ID>';
	runInDM = false;
	aliases = ['addc', 'createcourse', 'createc'];

	async permissions(msg: Message): Promise<boolean> {
		return await adminPerms(msg);
	}

	async run(msg: Message, [course]: [string]): Promise<Message> {
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
			id: ROLES.ADMIN,
			allow: 'VIEW_CHANNEL'
		}, {
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
		const staffPerms = [standardPerms[0], standardPerms[1], standardPerms[2]];

		const categoryChannel = await msg.guild.channels.create(`CISC ${course}`, {
			type: 'category',
			permissionOverwrites: standardPerms,
			reason
		});
		const generalChannel = await this.createTextChannel(msg.guild, `${course}_general`, standardPerms, categoryChannel.id, reason);
		await this.createTextChannel(msg.guild, `${course}_homework`, standardPerms, categoryChannel.id, reason);
		await this.createTextChannel(msg.guild, `${course}_labs`, standardPerms, categoryChannel.id, reason);
		await this.createTextChannel(msg.guild, `${course}_projects`, standardPerms, categoryChannel.id, reason);
		const staffChannel = await msg.guild.channels.create(`${course}_staff`, {
			type: 'text',
			parent: categoryChannel.id,
			topic: '[no message count]',
			permissionOverwrites: staffPerms,
			reason
		});
		const privateQuestionChannel = await msg.guild.channels.create(`${course}_private_qs`, {
			type: 'text',
			parent: categoryChannel.id,
			topic: '[no message count]',
			permissionOverwrites: staffPerms,
			reason
		});

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
		await msg.client.mongo.collection(DB.COURSES).insertOne(newCourse);
		return (await response).edit(`Added course with ID ${course}`);
	}

	async argParser(msg: Message, input: string): Promise<Array<string>> {
		if (input === '') {
			throw `Usage: ${this.usage}`;
		}

		if (await msg.client.mongo.collection(DB.COURSES).countDocuments({ name: input }) > 0) {
			throw `${input} has already been registered as a course.`;
		}

		return [input.toLowerCase()];
	}

	async createTextChannel(guild: Guild, name: string, permissionOverwrites: Array<OverwriteResolvable>, parent: string, reason: string): Promise<TextChannel> {
		return guild.channels.create(name, {
			type: 'text',
			parent,
			permissionOverwrites,
			reason
		});
	}

}
