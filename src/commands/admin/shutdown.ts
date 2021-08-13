import { BOT } from '@root/config';
import { botMasterPerms } from '@lib/permissions';
import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	aliases = ['sd'];
	description = `Sets ${BOT.NAME}'s activity to 'Playing Shutting Down...' and ends the process.`;

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	async run(msg: Message): Promise<void> {
		const bot = msg.client;
		bot.user.setActivity(`Shutting Down...`, { type: 'PLAYING' });
		msg.channel.send(`Shutting down ${BOT.NAME}`)
			.then(() => {
				bot.destroy();
				process.exit(0);
			});
	}

}
