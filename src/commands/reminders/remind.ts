import { BOT, DB } from '@root/config';
import { ApplicationCommandOptionData, CommandInteraction, Message } from 'discord.js';
import { Reminder } from '@lib/types/Reminder';
import parse from 'parse-duration';
import { reminderTime } from '@lib/utils';
import { Command } from '@lib/types/Command';

export default class extends Command {


	description = `Have ${BOT.NAME} give you a reminder.`;
	usage = '<reminder> | <duration> | [repeat]';
	extendedHelp = 'Reminders can be set to repeat daily or weekly.';
	options: ApplicationCommandOptionData[] = [
		{
			name: 'content',
			description: 'What you\'d like to be reminded of',
			type: 'STRING',
			required: true
		},
		{
			name: 'duration',
			description: 'When you\'d like to be reminded',
			type: 'STRING',
			required: true
		},
		{
			name: 'repeat',
			description: 'How often you want the reminder to repeat',
			choices: [{ name: 'daily', value: 'daily' }, { name: 'weekly', value: 'weekly' }],
			type: 'STRING',
			required: false
		}
	]

	tempRun(interaction: CommandInteraction): Promise<unknown> {
		const content = interaction.options.getString('content');
		const rawDuration = interaction.options.getString('duration');
		const duration = parse(rawDuration);
		const repeat = interaction.options.getString('repeat') as 'daily' | 'weekly' || null;

		if (!duration) {
			return interaction.reply({
				content: `**${rawDuration}** is not a valid duration. You can use words like hours, minutes, seconds, days, weeks, months, or years.`,
				ephemeral: true
			});
		}
		const reminder: Reminder = {
			owner: interaction.user.id,
			content,
			mode: interaction.channel.type === 'DM' ? 'private' : 'public',
			expires: new Date(duration + Date.now()),
			repeat
		};

		interaction.client.mongo.collection(DB.REMINDERS).insertOne(reminder);

		return interaction.reply({ content: `I'll remind you about that at ${reminderTime(reminder)}.`, ephemeral: true });
	}

	run(msg: Message, [reminder]: [Reminder]): Promise<Message> {
		msg.client.mongo.collection(DB.REMINDERS).insertOne(reminder);

		return msg.channel.send(`I'll remind you about that at ${reminderTime(reminder)}.`);
	}

	argParser(msg: Message, input: string): [Reminder] {
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
			mode: msg.channel.type === 'DM' ? 'private' : 'public',
			expires: new Date(duration + Date.now()),
			repeat
		}];
	}

}
