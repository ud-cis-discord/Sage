import { ApplicationCommandOptionData, ChatInputCommandInteraction, EmbedBuilder, ApplicationCommandOptionType, CommandInteractionOptionResolver, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';
import { generateErrorEmbed } from '@root/src/lib/utils/generalUtils';
import axios from 'axios';

export default class extends Command { // Made by matt nadar

	description = 'This command will give you a random cat fact';

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const response = await axios.get('https://catfact.ninja/fact');
		const fact = response.data['fact']
		return interaction.reply(`${fact}`);
	}

}
