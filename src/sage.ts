import 'module-alias/register';
import consoleStamp from 'console-stamp';
import { MongoClient } from 'mongodb';
import { ApplicationCommandPermissions, Client, IntentsBitField, Partials, Team, ActivityType, ApplicationCommandPermissionType } from 'discord.js';
import { readdirRecursive } from '@root/src/lib/utils/generalUtils';
import { DB, BOT, PREFIX, GITHUB_TOKEN } from '@root/config';
import { Octokit } from '@octokit/rest';
import { version as sageVersion } from '@root/package.json';
import { registerFont } from 'canvas';
import { SageData } from '@lib/types/SageData';
import { setBotmasterPerms } from './lib/permissions';

const BOT_INTENTS = [
	IntentsBitField.Flags.DirectMessages,
	IntentsBitField.Flags.Guilds,
	IntentsBitField.Flags.GuildModeration,
	IntentsBitField.Flags.GuildEmojisAndStickers,
	IntentsBitField.Flags.GuildIntegrations,
	IntentsBitField.Flags.GuildMembers,
	IntentsBitField.Flags.GuildMessages,
	IntentsBitField.Flags.GuildMessageReactions
];

const BOT_PARTIALS = [
	Partials.Channel,
	Partials.Message,
	Partials.GuildMember
];

consoleStamp(console, {
	format: ':date(dd/mm/yy hh:MM:ss.L tt)'
});

async function main() {
	const bot = new Client({
		partials: BOT_PARTIALS,
		intents: BOT_INTENTS,
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
		// I'm mad about this - Josh </3
		const team = (await bot.application.fetch()).owner as Team;
		setBotmasterPerms(team.members.map(value => {
			const permData: ApplicationCommandPermissions = {
				id: value.id,
				permission: true,
				type: ApplicationCommandPermissionType.User
			};
			return permData;
		}));

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

		// fix this so supports all types
		bot.user.setActivity(`${activity} (v${sageVersion})`, { type: ActivityType.Playing });
		setTimeout(() => bot.user.setActivity(activity, { type: ActivityType.Playing }), 30e3);
	});
}

main();
