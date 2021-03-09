import { BOT } from '@root/config';
import { Message } from 'discord.js';
import { Reminder } from '@lib/types/Reminder';
import parse from 'parse-duration';

export const description = `Have ${BOT.NAME} give you a reminder.`;
export const usage = '<reminder> | <duration> | [repeat]';
export const extendedHelp = 'Reminders can be set to repeat daily or weekly.';

export function run(msg: Message, [reminder]: [Reminder]): Promise<Message> {
	return msg.channel.send(`Content: ${reminder.content}
timestamp: ${reminder.expires},
repeat: ${reminder.repeat}
mode: ${reminder.mode}`);
}

export function argParser(msg: Message, input: string): [Reminder] {
	const [content, rawDuration, rawRepeat] = input.split('|').map(part => part.trim());
	const weekWords = ['w', 'week', 'weekly'];
	const dayWords = ['d', 'day', 'daily'];

	const duration = parse(rawDuration);
	if (!duration) throw `**${rawDuration}** is not a valid duration.`;

	const repeat = rawRepeat
		? weekWords.includes(rawRepeat.toLowerCase())
			? 'weekly'
			: dayWords.includes(rawRepeat.toLowerCase())
				? 'daily'
				: 'error'
		: null;

	if (repeat === 'error') throw `**${rawRepeat}** is not a valid repeat value.`;

	return [{
		owner: msg.author.id,
		content,
		mode: msg.channel.type === 'dm' ? 'private' : 'public',
		expires: new Date(duration + Date.now()),
		repeat
	}];
}
