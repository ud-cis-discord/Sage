import { Reminder } from '@lib/types/Reminder';
import { DB } from '@root/config';
import { Message } from 'discord.js';

export const aliases = ['cr'];

export function run(msg: Message, [reminder]: [Reminder]): Promise<Message> {
	msg.client.mongo.collection(DB.REMINDERS).findOneAndDelete(reminder);

	const hidden = reminder.mode === 'private' && msg.channel.type !== 'dm';
	return msg.channel.send(`Canceled reminder: **${hidden ? 'Private reminder.' : reminder.content}**`);
}

export async function argParser(msg: Message, input: string): Promise<Array<Reminder>> {
	const remindNum = parseInt(input) - 1;

	if (isNaN(remindNum)) throw 'Please provide a valid number.';

	const reminders: Array<Reminder> = await msg.client.mongo.collection(DB.REMINDERS).find({ owner: msg.author.id }).toArray();
	reminders.sort((a, b) => a.expires.valueOf() - b.expires.valueOf());
	const reminder = reminders[remindNum];

	if (!reminder) throw `I couldn't find reminder **${input}**. Use the \`viewremind\` command to see your current reminders.`;

	return [reminder];
}
