import { BOT, DB } from '@root/config';
import { ApplicationCommandOptionData, CommandInteraction } from 'discord.js';
import { Reminder } from '@lib/types/Reminder';
import parse from 'parse-duration';
import { reminderTime } from '@lib/utils';
import { Command } from '@lib/types/Command';

export default class extends Command {


	description = `Have ${BOT.NAME} give you a reminder.`;
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
			choices: [{ name: 'Daily', value: 'daily' }, { name: 'Weekly', value: 'weekly' }],
			type: 'STRING',
			required: false
		}
	]

	run(interaction: CommandInteraction): Promise<unknown> {
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
			// mode: interaction.channel.type === 'DM' ? 'private' : 'public',
			mode: 'public', // temporary
			expires: new Date(duration + Date.now()),
			repeat
		};

		interaction.client.mongo.collection(DB.REMINDERS).insertOne(reminder);

		return interaction.reply({ content: `I'll remind you about that at ${reminderTime(reminder)}.`, ephemeral: true });
	}

}
