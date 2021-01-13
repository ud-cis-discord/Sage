import { Course } from '@lib/types/Course';
import { Message } from 'discord.js';

export const runInGuild = false;

export function run(msg: Message, [course, question]: [Course, string]): Promise<Message> {
	return msg.channel.send('aaaahhhhh');
}
