import { Message, MessageReaction } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Press x to doubt';
	extendedHelp = 'This command must be used by replying to a message.';
	aliases = ['x'];

	async run(msg: Message): Promise<Message | MessageReaction> {
		if (!msg.reference) {
			return msg.channel.send(this.extendedHelp);
		}

		const message = await msg.channel.messages.fetch(msg.reference.messageId);
		return message.react('❎');
	}

}
