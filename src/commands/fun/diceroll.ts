import { ApplicationCommandOptionData, CommandInteraction, Message, MessageEmbed } from 'discord.js';
import { Command } from '@lib/types/Command';

const DEFAULT_RANGE = [1, 6];
const DEFAULT_ROLLS = 1;
export default class extends Command {

	description = `Get \`numdice\` random integers between \`minimum\` and \`maximum\`.`;
	extendedHelp = `User specified minimum and maximum are inclusive. If no range is specified, defaults to one number ranging from ${DEFAULT_RANGE[0]} to ${DEFAULT_RANGE[1]}.`;
	usage = '[min #] | [max #] | [numdice]';

	options: ApplicationCommandOptionData[] = [
		{
			name: 'minimum',
			description: `Minimum of the roll range (defaults to ${DEFAULT_RANGE[0]})`,
			type: 'NUMBER',
			required: false
		},
		{
			name: 'maximum',
			description: `Maximum of the roll range (defaults to ${DEFAULT_RANGE[1]})`,
			type: 'NUMBER',
			required: false
		},
		{
			name: 'numdice',
			description: `Number of dice to roll (1-10) (defaults to ${DEFAULT_ROLLS})`,
			type: 'NUMBER',
			required: false
		}
	]

	run(_msg: Message): Promise<void> { return; }

	tempRun(interaction: CommandInteraction): Promise<void> {
		let min = interaction.options.getNumber('minimum');
		let max = interaction.options.getNumber('maximum');
		const numRolls = interaction.options.getNumber('numdice') || DEFAULT_ROLLS;

		let responseEmbed: MessageEmbed;
		if (!min) {
			[min, max] = [DEFAULT_RANGE[0], DEFAULT_RANGE[1]];
		} else if (!max && min) {
			responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Argument error')
				.setDescription('If you provide a minimum, you must also provide a maximum.');
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		} else if (max < min) {
			responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Argument error')
				.setDescription('Your maximum must be greater than your minimum.');
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		} else if (numRolls < 1 || numRolls > 10) {
			responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Argument error')
				.setDescription('You can only roll between 1 and 10 dice.');
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		}

		const results = [];
		for (let i = 0; i < numRolls; i++) {
			results.push(Math.floor((Math.random() * (max - min + 1)) + min));
		}

		const nums = results.join(', ');
		let description;
		if (results.length === 1) {
			description = `Your random number is ${nums}.`;
		} else {
			description = `Your random numbers are ${nums}.`;
		}

		responseEmbed = new MessageEmbed()
			.setColor(Math.floor(Math.random() * 16777215))
			.setTitle('Random Integer Generator')
			.setDescription(description)
			.setFooter(`${interaction.user.username} rolled ${numRolls} dice ranging from ${min} to ${max}`);
		return interaction.reply({ embeds: [responseEmbed] });
	}

}
