import { GUILDS } from '@root/config';
import { Client } from 'discord.js';
import { schedule } from 'node-cron';
import { SpookyError } from '@lib/types/errors';

async function register(bot: Client): Promise<void> {
	schedule('52 * * * *', () => {
		enableSpook(bot)
			.catch(async error => bot.emit('error', error));
	});

	schedule('50 * * * *', () => {
		disableSpook(bot)
			.catch(async error => bot.emit('error', error));
	});
}

async function enableSpook(bot:Client) {
	const guild = bot.guilds.cache.get(GUILDS.MAIN);

	await guild.setIcon(`${__dirname}/../../../assets/images/spoopylogo.png`, 'Spoopifying the server.');

	bot.emit('error', new SpookyError('Spoopified the server'));
}

async function disableSpook(bot:Client) {
	const guild = bot.guilds.cache.get(GUILDS.MAIN);

	await guild.setIcon(`${__dirname}/../../../assets/images/cisc-logo.png`, 'Spoopifying the server.');

	bot.emit('error', new SpookyError('Un-spoopified the server'));
}

export default register;
