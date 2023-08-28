import { DB } from '@root/config';
import { Reminder } from '@lib/types/Reminder';
import { ChatInputCommandInteraction, EmbedBuilder, InteractionResponse } from 'discord.js';
import { reminderTime } from '@root/src/lib/utils/generalUtils';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'See your upcoming reminders.';
	extendedHelp = 'Don\'t worry, private reminders will be hidden if you use this command publicly.';

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const reminders: Array<Reminder> = await interaction.client.mongo.collection(DB.REMINDERS)
			.find({ owner: interaction.user.id }).toArray();
		reminders.sort((a, b) => a.expires.valueOf() - b.expires.valueOf());

		if (reminders.length < 1) {
			interaction.reply({ content: 'You don\'t have any pending reminders!', ephemeral: true });
		}

		const embeds: Array<EmbedBuilder> = [];

		reminders.forEach((reminder, i) => {
			if (i % 25 === 0) {
				embeds.push(new EmbedBuilder()
					.setTitle('Pending reminders')
					.setColor('DarkAqua'));
			}
			const hidden = reminder.mode === 'private';
			embeds[Math.floor(i / 25)].addFields({ name: `${i + 1}. ${hidden ? 'Private reminder' : reminder.content}`,
				value: hidden ? 'Some time in the future.' : reminderTime(reminder) });
		});

		interaction.reply({ embeds });
	}

}
