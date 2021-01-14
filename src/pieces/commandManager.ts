import { Collection, Client } from 'discord.js';
import * as fs from 'fs';
import { Command } from '@lib/types/Command';
import { MAINTAINERS, PREFIX } from '@root/config';
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

function register(bot: Client): void {
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
		if ((!msg.content.toLowerCase().startsWith(PREFIX) && msg.channel.type !== 'dm') || msg.author.bot) return;

		let commandName: string;
		if (msg.channel.type !== 'dm' || msg.content.toLowerCase().startsWith(PREFIX)) {
			[commandName] = msg.content.slice(PREFIX.length).trim().split(' ');
		} else {
			[commandName] = msg.content.split(' ');
		}
		const unparsedArgs = msg.content.slice(msg.content.indexOf(commandName) + commandName.length, msg.content.length).trim();

		const command = getCommand(bot, commandName);
		if (!command) return;

		if (msg.channel.type === 'dm' && command.runInDM === false) return msg.reply(`${command.name} is not avaliable in DMs.`);
		if (msg.channel.type === 'text' && command.runInGuild === false) {
			await msg.reply('That command is not avaliable here. Try again in DMs.');
			return msg.delete();
		}

		if (command.permissions && !await command.permissions(msg)) return msg.reply('Missing permissions');

		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		let args: Array<any>;
		if (command.argParser) {
			try {
				args = await command.argParser(msg, unparsedArgs);
			} catch (error) {
				msg.channel.send(error);
				return;
			}
		} else {
			args = [unparsedArgs];
		}

		try {
			command.run(msg, args);
		} catch (e) {
			await msg.reply(`An error occured. ${MAINTAINERS} have been notified.`);
			throw e;
		}
	});
}

export default register;
