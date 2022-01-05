import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Get a random number within a user-specified range (min and max inclusive). If no range is specified by the user, defaults to a range from 1 to 6. Also works for negative numbers!';
	usage = '[min #] | [max #]';
	aliases = ['random', 'rand'];

	run(msg: Message, [minimum, maximum]: Array<number>): Promise<Message> {
		return msg.channel.send(`Your random number is ${Math.floor((Math.random() * (maximum - minimum + 1)) + minimum)}`);
	}

	argParser(_msg: Message, input: string): Array<number> {
		const [minimum, maximum, ...rest] = input.split('|').map(arg => arg.trim());
		const DEFAULT_RANGE = [1, 6];
		if (!input) {
			return DEFAULT_RANGE;
		} else {
			if (rest.length > 0) {
				throw ('You have supplied too many arguments (maximum is 2).');
			}

			if (!maximum) {
				throw ('If you provide a minimum, you must also provide a maximum.');
			} else if (Number(maximum) < Number(minimum)) {
				throw ('Your minimum must be less than your maximum.');
			} else if (isNaN(Number(maximum)) || isNaN(Number(minimum))) {
				throw ('One or both of your inputs was not a number.');
			}
			return [Number(minimum), Number(maximum)];
		}
	}

}
