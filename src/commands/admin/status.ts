import { BOT } from '@root/config';
import { botMasterPerms } from '@lib/permissions';
import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Sets ${BOT.NAME}'s status.`;
	usage = '<online|idle|dnd|invisible>';

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	async run(msg: Message, [status]: ['online' | 'idle' | 'dnd' | 'invisible']): Promise<Message> {
		const bot = msg.client;
		await bot.user.setStatus(status);

		return msg.channel.send(`Set ${BOT.NAME}'s status to ${status}`);
	}

	argParser(msg: Message, input: string): [string] {
		if (input === '') {
			throw `Usage: ${this.usage}`;
		}

		const validStatuses = ['online', 'idle', 'dnd', 'invisible'];

		if (!validStatuses.includes(input = input.trim().toLowerCase())) {
			throw `invalid status ${input}. Status must be one of ${validStatuses.join(', ')}`;
		}

		return [input];
	}

}
