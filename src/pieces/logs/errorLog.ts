import { Client, TextChannel } from 'discord.js';
import { logError } from '@lib/utils';
import { LOG } from '@root/config';

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(LOG.ERROR) as TextChannel;
	bot.on('error', async error => {
		errLog.send(await logError(error));
	});
}

export default register;
