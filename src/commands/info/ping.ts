import { ChatInputCommandInteraction, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';
import prettyMilliseconds from 'pretty-ms';

export default class extends Command {

	description = 'Runs a connection test to Discord';

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const msgTime = new Date().getTime();
		await interaction.reply('Ping?');
		interaction.editReply(`Pong! Round trip took ${prettyMilliseconds(msgTime - interaction.createdTimestamp)}, REST ping ${interaction.client.ws.ping}ms.`);
		return;
	}

}
