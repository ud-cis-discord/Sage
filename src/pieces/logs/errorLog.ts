import { Client, TextChannel } from 'discord.js';
import { generateLogEmbed } from '@lib/utils';
import { CHANNELS } from '@root/config';

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(CHANNELS.ERROR_LOG) as TextChannel;
	bot.on('error', async error => {
		errLog.send(await generateLogEmbed(error));
	});
}

export default register;
