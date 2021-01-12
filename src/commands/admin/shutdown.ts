import { BOT } from '@root/config';
import { botMasterPerms } from '@lib/permissions';
import { Message } from 'discord.js';

export const aliases = ['sd'];
export const description = `Sets ${BOT.NAME}'s activity to 'Playing Shutting Down...' and ends the process.`;

export async function permissions(msg: Message): Promise<boolean> {
	return botMasterPerms(msg);
}

export async function run(msg: Message): Promise<void> {
	const bot = msg.client;
	await bot.user.setActivity(`Shutting Down...`, { type: 'PLAYING' });
	msg.channel.send(`Shutting down ${BOT.NAME}`)
		.then(() => {
			bot.destroy();
			process.exit(0);
		});
}
