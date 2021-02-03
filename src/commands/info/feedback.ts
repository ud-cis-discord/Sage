import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { BOT, CHANNELS, MAINTAINERS } from '@root/config';

export const description = `Provide feedback or bug reports about ${BOT.NAME}.`;
export const usage = '<suggestion>';
export const aliases = ['suggest'];

export async function run(msg: Message, [suggestion]: [string]): Promise<Message> {
	const feedbackChannel = await msg.client.channels.fetch(CHANNELS.FEEDBACK) as TextChannel;

	feedbackChannel.send(new MessageEmbed()
		.setAuthor(msg.author.tag, msg.author.avatarURL({ dynamic: true }))
		.setTitle('New Feedback')
		.setDescription(suggestion)
		.setColor('DARK_GREEN')
		.setTimestamp());

	return msg.channel.send(`Thanks! I've sent your feedback to ${MAINTAINERS}.`);
}

export function argParser(_msg: Message, input: string): [string] {
	if (input === '') throw `Usage: ${usage}`;
	return [input];
}
