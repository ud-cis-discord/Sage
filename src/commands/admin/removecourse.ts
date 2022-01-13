import { adminPerms, ADMIN_PERMS } from '@lib/permissions';
import { Course } from '@lib/types/Course';
import { CHANNELS, DB, SEMESTER_ID } from '@root/config';
import { Command } from '@lib/types/Command';
import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CategoryChannel, Message } from 'discord.js';

export default class extends Command {

	description = 'Remove a course';
	extendedHelp = 'This command will archive all channels in a courses category, remove all course roles,' +
	'and purge the course from the database. This is the only command with an `are you sure?` warning.';
	usage = '<course ID>';
	runInDM = false;
	aliases = ['deletecourse', 'removec', 'deletec'];
	tempPermissions: ApplicationCommandPermissionData[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'course',
		description: '',
		type: 'STRING',
		required: true
	}]

	permissions(msg: Message): boolean {
		return adminPerms(msg);
	}

	async run(msg: Message, [course]: [Course]): Promise<Message> {
		const category = await msg.client.channels.fetch(course.channels.category) as CategoryChannel;

		const channelCount = category.children.size;
		const userCount = await msg.client.mongo.collection(DB.USERS).countDocuments({ courses: course.name });
		const reason = `Removing course ${course.name} as requested by ${msg.author.tag} (${msg.author.id})`;

		await msg.channel.send(`Are you sure you want to delete ${course.name}. ` +
		`This action will archive ${channelCount} channels and unenroll ${userCount} users. ` +
		'Send `yes` in the next 30 seconds to confirm.');

		return msg.channel.awaitMessages({
			filter: (m: Message) => m.author.id === msg.author.id && m.content === 'yes',
			max: 1,
			time: 30e3,
			errors: ['time']
		}).then(async () => {
			const loadingMsg = await msg.channel.send('<a:loading:755121200929439745> working...');

			for (const channel of [...category.children.values()]) {
				await channel.setParent(CHANNELS.ARCHIVE, { reason });
				await channel.lockPermissions();
				await channel.setName(`${SEMESTER_ID}_${channel.name}`, reason);
			}
			await category.delete();

			await msg.guild.members.fetch();
			const staffRole = await msg.guild.roles.fetch(course.roles.staff);
			const studentRole = await msg.guild.roles.fetch(course.roles.student);

			for (const [, member] of staffRole.members) {
				if (member.roles.cache.has(staffRole.id)) await member.roles.remove(staffRole.id, reason);
			}
			for (const [, member] of studentRole.members) {
				if (member.roles.cache.has(studentRole.id)) await member.roles.remove(studentRole.id, reason);
			}

			staffRole.delete(reason);
			studentRole.delete(reason);

			await msg.client.mongo.collection(DB.USERS).updateMany({}, { $pull: { courses: course.name } });
			await msg.client.mongo.collection(DB.COURSES).findOneAndDelete({ name: course.name });

			return loadingMsg.edit(`${channelCount} channels archived and ${userCount} users unenrolled from ${course.name}`);
		})
			.catch(() => msg.channel.send('Time has expired, removal canceled.'));
	}

	async argParser(msg: Message, input: string): Promise<Array<Course>> {
		const course: Course = await msg.client.mongo.collection(DB.COURSES).findOne({ name: input.toLowerCase() });

		if (!course) throw `Could not find course **${input}**.`;

		return [course];
	}

}
