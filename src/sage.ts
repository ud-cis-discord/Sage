import 'module-alias/register';
import { Client } from 'discord.js';
import { BOT, PREFIX } from '@root/config';

const bot = new Client();
bot.login(BOT.TOKEN);

bot.on('ready', () => {
	console.log(`${BOT.NAME} online\n${bot.ws.ping}ms WS ping\nLogged into ${bot.guilds.cache.size} guilds\nServing ${bot.users.cache.size} users`);
	bot.user.setActivity(`${PREFIX}help`, { type: 'PLAYING' });
});
