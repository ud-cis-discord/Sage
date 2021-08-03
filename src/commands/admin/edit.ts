import { botMasterPerms } from '@lib/permissions';
import { Message, TextChannel } from 'discord.js';
import { BOT } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Edits a message sent by ${BOT.NAME}.`;
	usage = '<messageLink>|<content>';

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	async run(msg: Message, [message, content]: [Message, string]): Promise<Message> {
		await message.edit(content);
		return msg.channel.send('I\'ve updated that message.');
	}

	async argParser(msg: Message, input: string): Promise<[Message, string]> {
		const [link, content] = input.trim().split('|').map(inp => inp.trim());

		if (!link || !content) {
			throw `Usage: ${this.usage}`;
		}

		const newLink = link.replace('canary.', '');
		const match = newLink.match(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);

		if (!match) throw 'Please provide a valid message link.';

		const [,, channelID, messageID] = match;

		const message = await msg.client.channels.fetch(channelID)
			.then((channel: TextChannel) => channel.messages.fetch(messageID))
			.catch(() => { throw 'I can\'t seem to find that message'; });

		if (!message.editable) throw 'It seems I can\'t edit that message.';

		return [message, content];
	}

}
