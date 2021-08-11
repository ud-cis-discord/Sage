import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Press F to pay respects';
	aliases = ['respect'];

	run(msg: Message): Promise<Message> {
		return msg.channel.send({ files: [{
			attachment: `${__dirname}../../../../../assets/images/f.png`,
			name: 'pay_respects.png'
		}] });
	}

}
