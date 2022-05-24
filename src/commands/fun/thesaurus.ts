import { ApplicationCommandOptionData, CommandInteraction } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description: 'Finds a synomn of a word'
	options: ApplicationCommandOptionData[] = [
		{
			name: 'word',
			description: 'Synyom of that word',
			type: 'STRING',
			required: true
		}
	]
	run(interaction: CommandInteraction): Promise<void> {
		const input = interaction.options.getString('word');

		// Get the first word in the sentence and make it URL-friendly
		if (input.indexOf(' ') !== -1) {
			return interaction.reply({ content: 'You can only find an synyomn one word at a time!', ephemeral: true });
		}
		const word = encodeURIComponent(input.toLowerCase());
		return interaction.reply(`https://www.thesaurus.com/browse/${word}`);
	}

}
