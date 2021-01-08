import 'module-alias/register';
import { BOT, MONGO, PREFIX } from '@root/config';
import { SageClient } from '@lib/types/SageClient';
import commandManager from '@pieces/commandManager';
import roleHandler from '@pieces/roleHandler';
import { MongoClient } from 'mongodb';

const bot = new SageClient();

MongoClient.connect(MONGO, { useUnifiedTopology: true }).then((client) => {
	bot.mongo = client.db(BOT.NAME);
});

bot.login(BOT.TOKEN);

bot.on('ready', () => {
	console.log(`${BOT.NAME} online\n${bot.ws.ping}ms WS ping\nLogged into ${bot.guilds.cache.size} guilds\nServing ${bot.users.cache.size} users`);
	bot.user.setActivity(`${PREFIX}help`, { type: 'PLAYING' });
});

commandManager(bot);
roleHandler(bot);
