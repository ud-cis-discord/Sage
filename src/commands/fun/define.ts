import { ApplicationCommandOptionData, CommandInteraction } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Find the definition of a word.';
	options: ApplicationCommandOptionData[] = [
		{
			name: 'word',
			description: 'The word to define',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	]

	run(interaction: CommandInteraction): Promise<void> {
		const input = (interaction.options as CommandInteractionOptionResolver).getString('word');

		// Get the first word in the sentence and make it URL-friendly
		if (input.indexOf(' ') !== -1) {
			return interaction.reply({ content: 'You can only define one word at a time!', ephemeral: true });
		}
		const word = encodeURIComponent(input.toLowerCase());
		return interaction.reply(`https://www.merriam-webster.com/dictionary/${word}`);
	}

}
