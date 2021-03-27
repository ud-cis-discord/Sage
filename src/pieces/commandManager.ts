import { Collection, Client, Message, TextChannel } from 'discord.js';
import { Command } from '@lib/types/Command';
import { getCommand, generateLogEmbed, readdirRecursive } from '@lib/utils';
import { CHANNELS, MAINTAINERS, PREFIX } from '@root/config';

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(CHANNELS.ERROR_LOG) as TextChannel;

	try {
		await loadCommands(bot);
	} catch (e) {
		errLog.send(await generateLogEmbed(e));
	}

	bot.on('message', msg => {
		runCommand(msg, errLog)
			.catch(async e => errLog.send(await generateLogEmbed(e)));
	});

	bot.on('messageUpdate', (oldMsg, msg) => {
		if (oldMsg.content !== msg.content && '_edits' in msg) {
			runCommand(msg, errLog)
				.catch(async e => errLog.send(await generateLogEmbed(e)));
		}
	});
}

async function loadCommands(bot: Client) {
	bot.commands = new Collection();

	const commandFiles = readdirRecursive(`${__dirname}/../commands`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command: Command = await import(file);

		const dirs = file.split('/');
		const name = dirs[dirs.length - 1].split('.')[0];
		command.name = name;
		command.category = dirs[dirs.length - 2];

		bot.commands.set(name, command);
	}

	console.log(`${bot.commands.size} commands loaded.`);
}

async function runCommand(msg: Message, errLog: TextChannel) {
	if ((!msg.content.toLowerCase().startsWith(PREFIX) && msg.channel.type !== 'dm') || msg.author.bot) return;

	let commandName: string;
	if (msg.channel.type !== 'dm' || msg.content.toLowerCase().startsWith(PREFIX)) {
		[commandName] = msg.content.slice(PREFIX.length).trim().split(' ');
	} else {
		[commandName] = msg.content.split(' ');
	}
	const unparsedArgs = msg.content.slice(msg.content.indexOf(commandName) + commandName.length, msg.content.length).trim();

	const command = getCommand(msg.client, commandName);
	if (!command || command.enabled === false) return;

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

	command.run(msg, args)
		.catch(async (e: Error) => {
			msg.reply(`An error occurred. ${MAINTAINERS} have been notified.`);
			errLog.send(await generateLogEmbed(e));
		});
}

export default register;
