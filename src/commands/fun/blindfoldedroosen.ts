import { CommandInteraction, EmbedBuilder, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Challenge a blindfolded Prof. Roosen to a sword fight!';
	extendedHelp = 'You\'ve been challenged to a sword fight. However, your opponent, Professor Roosen, has decided to wear a blindfold. Feeling lucky?';

	run(interaction: CommandInteraction): Promise<InteractionResponse<boolean> | void> {
		// 5 is a random number I chose to be the blindfolded Roosen, no other meaning
		let responseEmbed: EmbedBuilder;
		if (Math.floor(Math.random() * 6) === 5) {
			responseEmbed = new EmbedBuilder()
				.setColor('#ff0000')
				.setTitle('Battle results')
				.setDescription('Ooooooooooooh... ouch! Blindfolded Roosen has killed you! You lose.');
		} else {
			responseEmbed = new EmbedBuilder()
				.setColor('#00ff00')
				.setTitle('Battle results')
				.setDescription('You\'ve won the fight against blindfolded Roosen. You live another day!');
		}
		return interaction.reply({ embeds: [responseEmbed] });
	}

}
