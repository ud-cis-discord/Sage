import { botMasterPerms } from '@lib/permissions';
import { channelParser } from '@lib/arguments';
import { TextChannel, Message } from 'discord.js';
import { CHANNELS } from '@root/config';

export const description = 'Sends an announcement from Sage to a specified channel or announcements if no channel is given.';
export const usage = '[channel]|<content>';

export async function permissions(msg: Message): Promise<boolean> {
	return await botMasterPerms(msg);
}

export async function run(msg: Message, [channel, content]: [TextChannel, string]): Promise<Message> {
	await channel.send(content, {
		files: msg.attachments.map(attachment => attachment.attachment),
		disableMentions: 'none',
		allowedMentions: { parse: ['everyone', 'roles'] }
	});

	return msg.channel.send(`Your announcement has been sent in ${channel}`);
}

export async function argParser(msg: Message, input: string): Promise<[TextChannel, string]> {
	const args = input.trim().split('|');

	if (!args[0] && msg.attachments.size === 0) {
		throw `Usage: ${usage}`;
	}

	const channel = args.length > 1 ? args.shift() : null;
	const content = args.join('|');

	const retChannel = channel
		? channelParser(msg, channel) : msg.guild.channels.cache.get(CHANNELS.ANNOUNCEMENTS) as TextChannel;

	return [retChannel, content];
}
