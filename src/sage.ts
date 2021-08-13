import 'module-alias/register';
import consoleStamp from 'console-stamp';
import { MongoClient } from 'mongodb';
import { Client } from 'discord.js';
import { readdirRecursive } from '@lib/utils';
import { DB, BOT, PREFIX, GITHUB_TOKEN } from '@root/config';
import { Octokit } from '@octokit/rest';
import { version as sageVersion } from '@root/package.json';
import { registerFont } from 'canvas';
import { SageData } from '@lib/types/SageData';

const ALL_INTENTS = 8;

consoleStamp(console, {
	format: ':date(dd/mm/yy hh:MM:ss.L tt)'
});

async function main() {
	const bot = new Client({
		intents: [ALL_INTENTS],
		allowedMentions: { parse: ['users'] }
	});

	await MongoClient.connect(DB.CONNECTION, { useUnifiedTopology: true }).then((client) => {
		bot.mongo = client.db(BOT.NAME);
	});

	bot.login(BOT.TOKEN);

	bot.octokit = new Octokit({
		auth: GITHUB_TOKEN,
		userAgent: `Sage v${sageVersion}`
	});

	registerFont(`${__dirname}/../../assets/Roboto-Regular.ttf`, { family: 'Roboto' });

	bot.once('ready', async () => {
		const pieceFiles = readdirRecursive(`${__dirname}/pieces`);
		for (const file of pieceFiles) {
			const piece = await import(file);
			const dirs = file.split('/');
			const name = dirs[dirs.length - 1].split('.')[0];
			if (typeof piece.default !== 'function') throw `Invalid piece: ${name}`;
			piece.default(bot);
			console.log(`${name} piece loaded.`);
		}

		console.log(`${BOT.NAME} online`);
		console.log(`${bot.ws.ping}ms WS ping`);
		console.log(`Logged into ${bot.guilds.cache.size} guilds`);
		console.log(`Serving ${bot.users.cache.size} users`);

		// eslint-disable-next-line no-extra-parens
		const status = (await bot.mongo.collection(DB.CLIENT_DATA).findOne({ _id: bot.user.id }) as SageData)?.status;

		const activity = status?.name || `${PREFIX}help`;
		const type = status?.type || 'PLAYING';
		bot.user.setActivity(`${activity} (v${sageVersion})`, { type });
		setTimeout(() => bot.user.setActivity(activity, { type }), 30e3);
	});
}

main();
