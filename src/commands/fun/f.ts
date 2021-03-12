import { Message } from 'discord.js';

export const description = 'Press F to pay respects';
export const aliases = ['respect'];

export function run(msg: Message): Promise<Message> {
	return msg.channel.send({ files: [{ attachment: './assets/images/f.png', name: 'pay_respects.png' }] });
}
