import { ApplicationCommandOptionData, ChatInputCommandInteraction, EmbedBuilder, ApplicationCommandOptionType, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';
import { generateErrorEmbed } from '@root/src/lib/utils/generalUtils';

const DEFAULT_RANGE = [1, 6];
const DEFAULT_ROLLS = 1;
export default class extends Command {

	description = `Get \`numdice\` random integers between \`minimum\` and \`maximum\`.`;
	extendedHelp = `User specified minimum and maximum are inclusive. If no range is specified, defaults to one number ranging from ${DEFAULT_RANGE[0]} to ${DEFAULT_RANGE[1]}.`;

	options: ApplicationCommandOptionData[] = [
		{
			name: 'minimum',
			description: `Minimum of the roll range (defaults to ${DEFAULT_RANGE[0]})`,
			type: ApplicationCommandOptionType.Number,
			required: false
		},
		{
			name: 'maximum',
			description: `Maximum of the roll range (defaults to ${DEFAULT_RANGE[1]})`,
			type: ApplicationCommandOptionType.Number,
			required: false
		},
		{
			name: 'numdice',
			description: `Number of dice to roll (1-10) (defaults to ${DEFAULT_ROLLS})`,
			type: ApplicationCommandOptionType.Number,
			required: false
		},
		{
			name: 'keephighest',
			description: `How many dice to keep/total (defaults to the number of dice you're rolling)`,
			type: ApplicationCommandOptionType.Number,
			required: false
		}

	]

	run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		let min = interaction.options.getNumber('minimum');
		let max = interaction.options.getNumber('maximum');
		const numRolls = interaction.options.getNumber('numdice') || DEFAULT_ROLLS;
		const keepHighest = interaction.options.getNumber('keephighest') || numRolls;

		if (!min) {
			[min, max] = [DEFAULT_RANGE[0], max || DEFAULT_RANGE[1]];
		} else if (!max && min) {
			return interaction.reply({ embeds: [generateErrorEmbed('If you provide a minimum, you must also provide a maximum.')], ephemeral: true });
		} else if (max < min) {
			return interaction.reply({ embeds: [generateErrorEmbed('Your maximum must be greater than your minimum.')], ephemeral: true });
		} if (!Number.isInteger(min) || !Number.isInteger(max)) {
			return interaction.reply({ embeds: [generateErrorEmbed('The values you entered were not whole numbers. Remember that this command works with integers only.')], ephemeral: true });
		} if (numRolls < 1 || numRolls > 10 || !Number.isInteger(numRolls)) {
			return interaction.reply({ embeds: [generateErrorEmbed('You can only roll between 1 and 10 whole dice.')], ephemeral: true });
		} if (!Number.isInteger(keepHighest) || keepHighest <= 0) {
			return interaction.reply({ embeds: [generateErrorEmbed('The number of dice you keep must be a **positive integer**.')], ephemeral: true });
		} if (keepHighest > numRolls) {
			return interaction.reply({ embeds: [generateErrorEmbed('The number of dice you keep must be lower than the number of dice you roll.')], ephemeral: true });
		}

		const results = [];
		for (let i = 0; i < numRolls; i++) {
			results.push(Math.floor((Math.random() * (max - min + 1)) + min));
		}

		const sorted = [...results].sort((a, b) => b - a);
		const total: number = sorted.splice(0, keepHighest).reduce((prev, cur) => prev + cur, 0);

		const totalText = keepHighest === 1
			? `Your total roll is **${total}**.`
			: `The total of the ${keepHighest} highest dice is **${total}**`;

		const nums = results.join(', ');
		const embedFields = [
			{
				name: `Roll${results.length === 1 ? '' : 's'}`,
				value: `Your random number${results.length === 1 ? ' is' : 's are'} ${nums}.`,
				inline: true
			},
			{
				name: 'Result',
				value: totalText
			}
		];

		const responseEmbed = new EmbedBuilder()
			.setColor(Math.floor(Math.random() * 16777215))
			.setTitle('Random Integer Generator')
			.setFields(embedFields)
			.setFooter({ text: `${interaction.user.username} rolled ${numRolls} dice ranging from ${min} to ${max}` });
		return interaction.reply({ embeds: [responseEmbed] });
	}

}
