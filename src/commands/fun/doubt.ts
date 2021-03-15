import { Message, MessageReaction } from 'discord.js';

export const description = 'Press <:x2doubt:736267995663564830> to doubt';
export const extendedHelp = 'This command must be used by replying to a message.';
export const aliases = ['x'];

export async function run(msg: Message): Promise<Message | MessageReaction> {
	if (!msg.reference) {
		return msg.channel.send(extendedHelp);
	}

	const message = await msg.channel.messages.fetch(msg.reference.messageID);
	return message.react('736267995663564830');
}
