import { botMasterPerms } from '@lib/permissions';
import { channelParser } from '@lib/arguments';
import { TextChannel, Message } from 'discord.js';
import { CHANNELS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Sends an announcement from Sage to a specified channel or announcements if no channel is given.';
	usage = '[channel] | <content>';

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	async run(msg: Message, [channel, content]: [TextChannel, string]): Promise<Message> {
		await channel.send({
			content: content,
			files: [...msg.attachments.values()],
			allowedMentions: { parse: ['everyone', 'roles'] }
		});

		return msg.channel.send(`Your announcement has been sent in ${channel}`);
	}

	async argParser(msg: Message, input: string): Promise<[TextChannel, string]> {
		const args = input.trim().split('|');

		if (!args[0] && msg.attachments.size === 0) {
			throw `Usage: ${this.usage}`;
		}

		const channel = args.length > 1 ? args.shift() : null;
		const content = args.join('|');

		const retChannel = channel
			? channelParser(msg, channel) : msg.guild.channels.cache.get(CHANNELS.ANNOUNCEMENTS) as TextChannel;

		return [retChannel, content];
	}

}
