import { ApplicationCommandOptionData, CommandInteraction, Message } from 'discord.js';
import { Command } from '@lib/types/Command';

const DEFAULT_RANGE = [1, 6];
export default class extends Command {

	// tempPermissions: ApplicationCommandPermissionData[] = [{
	// 	id: ROLES.STAFF,
	// 	type: 'ROLE',
	// 	permission: true
	// }];

	description = `Get a random integer between \`minimum\` and \`maximum\`.`;
	extendedHelp = `User specified minimum and maximum are inclusive. If no range is specified, defaults to a range from ${DEFAULT_RANGE[0]} to ${DEFAULT_RANGE[1]}.`;
	usage = '[min #] | [max #]';
	aliases = ['random', 'rand', 'dice', 'roll'];

	options: ApplicationCommandOptionData[] = [
		{
			name: 'minimum',
			description: 'minimum of the roll range',
			type: 'NUMBER',
			required: false
		},
		{
			name: 'maximum',
			description: 'minimum of the roll range',
			type: 'NUMBER',
			required: false
		}
	]

	run(_msg: Message): Promise<void> { return; }

	tempRun(interaction: CommandInteraction): Promise<void> {
		const min = interaction.options.getNumber('minimum') || DEFAULT_RANGE[0];
		const max = interaction.options.getNumber('maximum') || DEFAULT_RANGE[1];
		return interaction.reply(`Your random number is ${Math.floor((Math.random() * (max - min + 1)) + min)}`);
	}

	argParser(_msg: Message, input: string): Array<number> {
		const [minimum, maximum, ...rest] = input.split('|').map(arg => arg.trim());
		if (!input) {
			return DEFAULT_RANGE;
		} else {
			if (rest.length > 0) {
				throw 'You have supplied too many arguments (maximum is 2).';
			}

			if (!maximum) {
				throw 'If you provide a minimum, you must also provide a maximum.';
			} else if (Number(maximum) < Number(minimum)) {
				throw 'Your minimum must be less than your maximum.';
			} else if (isNaN(Number(maximum)) || isNaN(Number(minimum))) {
				throw 'One or both of your inputs was not a number.';
			}
			return [Number(minimum), Number(maximum)];
		}
	}

}
