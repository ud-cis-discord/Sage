import { ChatInputCommandInteraction, EmbedBuilder, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';
import axios from 'axios';

export default class extends Command {

	description = 'Get a quote from historical figures via ZenQuotes API at https://zenquotes.io/';

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const response = await axios.get('https://zenquotes.io/api/random');
		const quote = response.data[0];
		const responseEmbed = new EmbedBuilder()
			.setColor('#3CD6A3')
			.setTitle(`${quote.a}:`)
			.setDescription(`"${quote.q}"`);
		return interaction.reply({ embeds: [responseEmbed] });
	}

}
