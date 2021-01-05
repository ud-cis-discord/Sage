import { Message } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';

export const decription = 'Runs a connection test to Discord';

export async function fun(msg: Message): Promise<Message> {
	const responce = await msg.channel.send('Ping?');
	return responce.edit(`Pong! Round trip took ${prettyMilliseconds(responce.createdTimestamp - msg.createdTimestamp)}, REST ping ${msg.client.ws.ping}ms.`);
}
