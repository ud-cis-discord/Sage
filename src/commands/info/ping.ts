import { Message } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Runs a connection test to Discord';

	async run(msg: Message): Promise<Message> {
		const response = await msg.channel.send('Ping?');
		return response.edit(`Pong! Round trip took ${prettyMilliseconds(response.createdTimestamp - msg.createdTimestamp)}, REST ping ${msg.client.ws.ping}ms.`);
	}

}
