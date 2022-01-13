import { CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Challenge a blindfolded Prof. Roosen to a sword fight!';
	extendedHelp = 'You\'ve been challenged to a sword fight. However, your opponent, Professor Roosen, has decided to wear a blindfold. Feeling lucky?';

	run(_msg: Message): Promise<void> { return; }

	tempRun(interaction: CommandInteraction): Promise<void> {
		const chosenSword = Math.floor(Math.random() * 6);
		// 5 is a random number I chose to be the blindfolded Roosen, no other meaning
		let responseEmbed: MessageEmbed;
		if (chosenSword === 5) {
			responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Battle results')
				.setDescription('Ooooooooooooh... ouch! Blindfolded Roosen has killed you! You lose.');
			return interaction.reply({ embeds: [responseEmbed] });
		} else {
			responseEmbed = new MessageEmbed()
				.setColor('#00ff00')
				.setTitle('Battle results')
				.setDescription('You\'ve won the fight against blindfolded Roosen. You live another day!');
			return interaction.reply({ embeds: [responseEmbed] });
		}
	}

}
