import { CHANNELS, GUILDS } from '@root/config';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { schedule } from 'node-cron';

async function register(bot: Client): Promise<void> {
	// Runs of the first of October at midnight
	// schedule('0 0 1 10 *', () => {
	schedule('24 * * * *', () => {
		enableSpook(bot)
			.catch(async error => bot.emit('error', error));
	});

	// Runs on the first of November at midnight
	// schedule('0 0 1 11 *', () => {
	schedule('25 * * * *', () => {
		disableSpook(bot)
			.catch(async error => bot.emit('error', error));
	});
}

async function enableSpook(bot:Client) {
	const guild = bot.guilds.cache.get(GUILDS.MAIN);
	const serverLog = guild.channels.fetch(CHANNELS.SERVER_LOG) as Promise<TextChannel>;

	await guild.setIcon(`${__dirname}/../../../assets/images/spoopylogo.png`, 'Spoopifying the server.');

	(await serverLog).send({
		embeds: [
			new MessageEmbed()
				.setColor('DARK_ORANGE')
				.setTitle('Spoopification has taken place')
				.setThumbnail(guild.iconURL())
		]
	})
}

async function disableSpook(bot:Client) {
	const guild = bot.guilds.cache.get(GUILDS.MAIN);
	const serverLog = guild.channels.fetch(CHANNELS.SERVER_LOG) as Promise<TextChannel>;


	await guild.setIcon(`${__dirname}/../../../assets/images/cisc-logo.png`, 'Unspoopifying the server.');

	(await serverLog).send({
		embeds: [
			new MessageEmbed()
				.setColor('DARK_ORANGE')
				.setTitle('Spoopification has been removed')
				.setThumbnail(guild.iconURL())
		]
	})
}

export default register;
