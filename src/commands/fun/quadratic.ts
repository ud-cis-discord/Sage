import { Command } from '@lib/types/Command';
import { ApplicationCommandOptionData, ChatInputCommandInteraction, EmbedBuilder, ApplicationCommandOptionType, InteractionResponse } from 'discord.js';
import { generateErrorEmbed } from '@root/src/lib/utils/generalUtils';

export default class extends Command {

	// Written by Maxwell Wang (mwang840 on github)
	description: `Sage decides to study calculus and will attempt to find a solution to a quadratic formula`;
	extendedHelp: `User should specify a integer coefficient (C) in front of the x-squared, x and the constant C, (if not, the constant defaults to 0).`;

	options: ApplicationCommandOptionData[] = [
		{
			name: 'a',
			description: `The coefficient that goes in front of the x squared (minimum defaults to 0)`,
			type: ApplicationCommandOptionType.Number,
			required: true
		},
		{
			name: 'b',
			description: `The coefficient which goes in front of x (minimum defaults to 0)`,
			type: ApplicationCommandOptionType.Number,
			required: true
		},
		{
			name: 'c',
			description: `The constant itself, (minimum defaults to 0)`,
			type: ApplicationCommandOptionType.Number,
			required: true
		}
	]
	run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse> {
		// Grabs the numbers the client places in for the quadratic equation
		const xSquared = interaction.options.getNumber('a') || 0;
		const x = interaction.options.getNumber('b') || 0;
		const constant = interaction.options.getNumber('c') || 0;
		// Parses the float and rounds both the negative and positive results to two decimal places
		const negativeRt = parseFloat((((-1 * x) - Math.sqrt((x * x) - (4 * xSquared * x))) / (2 * xSquared)).toString()).toFixed(2);
		const positiveRt = parseFloat((((-1 * x) - Math.sqrt((x * x) - (4 * xSquared * x))) / (2 * xSquared)).toString()).toFixed(2);
		if (Number.isNaN(negativeRt) || Number.isNaN(positiveRt)) {
			return interaction.reply({ embeds: [generateErrorEmbed('No solution found for this equation, please enter numbers which I can get a viable solution.')], ephemeral: true });
		}
		// Result should be in an embed assuming a solution is found
		const responseEmbed = new EmbedBuilder()
			.setDescription('User applied quadratic formula')
			.setColor(Math.floor(Math.random() * 16777215))
			.setTitle('Random Integer Generator')
			.setFooter({ text: `${interaction.user.username} took the sqrt of ${xSquared} x^2 + ${x} + x + ${constant} and got the solutions ${negativeRt} and ${positiveRt}` });
		return interaction.reply({ embeds: [responseEmbed] });
	}

}
