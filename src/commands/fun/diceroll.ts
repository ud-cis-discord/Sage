import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';

const DEFAULT_RANGE = [1, 6];
export default class extends Command {

	description = `Get a random integer within a user-specified range (min and max inclusive). If no range is specified, defaults to a range from ${DEFAULT_RANGE[0]} to ${DEFAULT_RANGE[1]}.`;
	usage = '[min #] | [max #]';
	aliases = ['random', 'rand', 'dice', 'roll'];

	run(msg: Message, [minimum, maximum]: Array<number>): Promise<Message> {
		return msg.channel.send(`Your random number is ${Math.floor((Math.random() * (maximum - minimum + 1)) + minimum)}`);
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
