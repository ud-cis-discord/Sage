import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'You are running from angry Ada who has decided to chase you';
	extendedHelp = 'You\'ve to escape before Ada decides to maul you to death as she has mistaken you for dog food hehe';

	run(interaction: CommandInteraction): Promise<void> {
		// 5 is a random number I chose to be the blindfolded Roosen, no other meaning
		let responseEmbed: MessageEmbed;
		if (Math.floor(Math.random() * 6) === 5) {
			responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Battle results')
				.setDescription('Ouchies! Angry Ada has mauled you! You lose boi : (.');
		} else {
			responseEmbed = new MessageEmbed()
				.setColor('#00ff00')
				.setTitle('Battle results')
				.setDescription('You\'ve won the fight against angry Ada. You live another day!');
		}
		return interaction.reply({ embeds: [responseEmbed] });
	}

}
