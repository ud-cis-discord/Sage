import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Get a random number within a user-specified range (min and max inclusive). If no range is specified by the user, defaults to a range from 1 to 6. Also works for negative numbers!';
	usage = '<min #> | <max #>';
	aliases = ['random', 'rand'];

	run(msg: Message, [minimum, maximum]: Array<number>): Promise<Message> {
		return msg.channel.send(`Your random number is ${Math.floor((Math.random() * (maximum - minimum + 1)) + minimum)}`);
	}

	argParser(_msg: Message, input: string): Array<number> {
		const [minimum, maximum] = input.split('|').map(arg => arg.trim());
		if (!input) {
			return [1, 6];
		} else {
			if (!maximum) {
				throw ('If you provide a minimum, you must also provide a maximum.');
			} else if (Number(maximum) < Number(minimum)) {
				throw ('Your minimum must be less than your maximum.');
			}
			return [Number(minimum), Number(maximum)];
		}
	}

}
