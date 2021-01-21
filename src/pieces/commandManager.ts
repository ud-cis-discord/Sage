import { Collection, Client } from 'discord.js';
import { Command } from '@lib/types/Command';
import { MAINTAINERS, PREFIX } from '@root/config';
import { getCommand, readdirRecursive } from '@lib/utils';

async function register(bot: Client): Promise<void> {
	bot.commands = new Collection();
	const commandFiles = readdirRecursive('./dist/src/commands').filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command: Command = await import(`@root/../${file}`);
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

		if (msg.channel.type === 'dm' && command.runInDM === false) return msg.reply(`${command.name} is not available in DMs.`);
		if (msg.channel.type === 'text' && command.runInGuild === false) {
			await msg.reply('That command is not available here. Try again in DMs.');
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
			await msg.reply(`An error occurred. ${MAINTAINERS} have been notified.`);
			throw e;
		}
	});
}

export default register;
