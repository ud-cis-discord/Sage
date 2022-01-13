import { CommandInteraction, Message } from 'discord.js';
import { Command } from '@lib/types/Command';
import prettyMilliseconds from 'pretty-ms';

export default class extends Command {

	description = 'Runs a connection test to Discord';

	// left in for the export default
	async run(msg: Message): Promise<Message> {
		const response = await msg.channel.send('Ping?');
		return response.edit(`Pong! Round trip took ${prettyMilliseconds(response.createdTimestamp - msg.createdTimestamp)}, REST ping ${msg.client.ws.ping}ms.`);
	}

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const msgTime = new Date().getTime();
		await interaction.reply('Ping?');
		interaction.editReply(`Pong! Round trip took ${prettyMilliseconds(msgTime - interaction.createdTimestamp)}, REST ping ${interaction.client.ws.ping}ms.`);
		return;
	}

}
