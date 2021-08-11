import { Message } from 'discord.js';
import { Course } from '@lib/types/Course';
import { SageUser } from '@lib/types/SageUser';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Enroll yourself in a course.';
	usage = '<course>';
	extendedHelp = 'If you use this command on a course you are already enrolled in, you will be unenrolled.';
	runInDM = false;
	aliases = ['unenroll'];

	async run(msg: Message, [desiredCourse]: [string]): Promise<Message> {
		const courses: Array<Course> = await msg.client.mongo.collection(DB.COURSES).find().toArray();
		const course = courses.find(c => c.name === desiredCourse);

		if (!course) {
			return msg.channel.send(`Could not find course: ${desiredCourse}.\nAvailable courses: \`${courses.map(c => c.name).sort().join('`, `')}\``);
		}

		const user: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: msg.member.id });
		const enroll = !user.courses.includes(course.name);

		if (enroll) {
			user.courses.push(course.name);
			msg.member.roles.add(course.roles.student, `Enrolled in ${course.name}.`);
		} else {
			user.courses = user.courses.filter(c => c !== course.name);
			msg.member.roles.remove(course.roles.student, `Unenrolled from ${course.name}.`);
		}

		msg.client.mongo.collection(DB.USERS).updateOne({ discordId: msg.member.id }, { $set: { ...user } });

		return msg.channel.send(`You have been ${enroll ? 'enrolled in' : 'unenrolled from'} ${course.name}.`);
	}

	argParser(_msg: Message, input: string): Array<string> {
		if (input === '') throw `Usage: ${this.usage}`;
		return [input.toLowerCase()];
	}

}
