import { DB } from '@root/config';
import { Reminder } from '@lib/types/Reminder';
import { Message, MessageEmbed } from 'discord.js';
import { reminderTime } from '@lib/utils';

export const description = 'See your upcoming reminders.';
export const extendedHelp = 'Don\'t worry, private reminders will be hidden if you use this command publicly.';
export const aliases = ['showremind', 'showreminders', 'sr', 'viewremind', 'vr'];

export async function run(msg: Message) : Promise<void> {
	const reminders: Array<Reminder> = await msg.client.mongo.collection(DB.REMINDERS).find({ owner: msg.author.id }).toArray();
	reminders.sort((a, b) => a.expires.valueOf() - b.expires.valueOf());

	if (reminders.length < 1) {
		msg.channel.send('You don\'t have any pending reminders!');
	}

	const embeds: Array<MessageEmbed> = [];

	reminders.forEach((reminder, i) => {
		if (i % 25 === 0) {
			embeds.push(new MessageEmbed()
				.setTitle('Pending reminders')
				.setColor('DARK_AQUA'));
		}
		const hidden = reminder.mode === 'private' && msg.channel.type !== 'dm';
		embeds[Math.floor(i / 25)].addField(
			`${i + 1}. ${hidden ? 'Private reminder' : reminder.content}`,
			hidden ? 'Some time in the future.' : reminderTime(reminder));
	});

	embeds.forEach(embed => msg.channel.send(embed));
}
