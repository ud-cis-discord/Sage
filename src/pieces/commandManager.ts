import { Collection } from 'discord.js';
import * as fs from 'fs';
import { SageClient } from '@lib/types/SageClient';
import { Command } from '@lib/types/Command';
import { PREFIX } from '@root/config';
import { getCommand } from '../lib/utils';

function readdirRecursive(dir: string): string[] {
	let results = [];
	const list = fs.readdirSync(dir);
	list.forEach((file) => {
		file = `${dir}/${file}`;
		const stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			/* Recurse into a subdirectory */
			results = results.concat(readdirRecursive(file));
		} else {
			/* Is a file */
			results.push(file);
		}
	});
	return results;
}

function regester(bot: SageClient): void {
	bot.commands = new Collection();
	const commandFiles = readdirRecursive('./dist/src/commands').filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const command: Command = require(`@root/../${file}`);
		const dirs = file.split('/');
		const name = dirs[dirs.length - 1].split('.')[0];
		command.name = name;
		command.category = dirs[dirs.length - 2];
		bot.commands.set(name, command);
	}
	bot.on('message', async (msg) => {
		if (!msg.content.startsWith(PREFIX) || msg.author.bot) return;

		const args = msg.content.slice(PREFIX.length).trim().split(/ +/);
		const commandName = args.shift().toLowerCase();

		const command = getCommand(bot, commandName);
		if (!command) return;

		try {
			if (command.permissions && !command.permissions(msg)) return msg.reply('Missing permissions');
			command.run(msg, args);
		} catch (e) {
			await msg.reply('An error occured.');
			throw e;
		}
	});
}

export default regester;
