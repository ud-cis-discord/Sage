import { Collection, Client, Message } from 'discord.js';
import { getCommand, readdirRecursive } from '@lib/utils';
import { Command } from '@lib/types/Command';
import { SageData } from '@lib/types/SageData';
import { CommandError } from '@lib/types/errors';
import { DB, MAINTAINERS, PREFIX, CHANNELS } from '@root/config';

async function register(bot: Client): Promise<void> {
	try {
		await loadCommands(bot);
	} catch (error) {
		bot.emit('error', error);
	}

	bot.on('messageCreate', msg => {
		if (msg.channel.partial) msg.channel.fetch();
		runCommand(msg)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('messageUpdate', (oldMsg, msg) => {
		if (oldMsg.content !== msg.content && '_update' in msg) {
			runCommand(msg)
				.catch(async error => bot.emit('error', error));
		}
	});
}

async function loadCommands(bot: Client) {
	bot.commands = new Collection();
	const sageData = await bot.mongo.collection(DB.CLIENT_DATA).findOne({ _id: bot.user.id }) as SageData;
	const oldCommandSettings = sageData?.commandSettings || [];

	const commandFiles = readdirRecursive(`${__dirname}/../commands`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const commandModule = await import(file);

		const dirs = file.split('/');
		const name = dirs[dirs.length - 1].split('.')[0];

		// semi type-guard, typeof returns function for classes
		if (!(typeof commandModule.default === 'function')) {
			console.log(`Invalid command ${name}`);
			continue;
		}

		// eslint-disable-next-line new-cap
		const command: Command = new commandModule.default;

		command.name = name;
		command.category = dirs[dirs.length - 2];

		const oldSettings = oldCommandSettings.find(cmd => cmd.name === command.name);
		let enable: boolean;
		let restrict: boolean;
		if (oldSettings) {
			enable = oldSettings.enabled;
			restrict = oldSettings.restricted;
		} else {
			enable = command.enabled !== false;
			restrict = command.restricted !== false;
			oldCommandSettings.push({ name: command.name, enabled: enable, restricted: restrict });
		}
		command.enabled = enable;

		bot.commands.set(name, command);

		bot.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: bot.user.id },
			{ $set: { commandSettings: oldCommandSettings } },
			{ upsert: true }
		);
	}

	console.log(`${bot.commands.size} commands loaded.`);
}

async function runCommand(msg: Message) {
	if ((!msg.content.toLowerCase().startsWith(PREFIX) && msg.channel.type !== 'DM') || msg.author.bot) return;

	let commandName: string;
	if (msg.channel.type !== 'DM' || msg.content.toLowerCase().startsWith(PREFIX)) {
		[commandName] = msg.content.slice(PREFIX.length).trim().split(' ');
	} else {
		[commandName] = msg.content.split(' ');
	}
	const unparsedArgs = msg.content.slice(msg.content.indexOf(commandName) + commandName.length, msg.content.length).trim();

	const command = getCommand(msg.client, commandName);
	if (!command || command.enabled === false) return;

	//	restricted commands
	if (msg.guild && command.restricted && msg.channel.id !== CHANNELS.SAGE) {
		msg.author.send(`${command.name} is only available in <#${CHANNELS.SAGE}>`);
		return msg.delete();
	}

	if (msg.channel.type === 'DM' && command.runInDM === false) return msg.reply(`${command.name} is not available in DMs.`);
	if (msg.channel.type === 'GUILD_TEXT' && command.runInGuild === false) {
		await msg.author.send(`<@!${msg.author.id}>, the command you just tried to run is not available in public channels. Try again in DMs.`)
			.catch(async () => { await msg.reply('That command is not available here, try again in DMs'); });
		return msg.delete();
	}

	if (command.permissions && !await command.permissions(msg)) return msg.reply('Missing permissions');

	let args: Array<unknown>;
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
		command.run(msg, args)
			?.catch(async (error: Error) => {
				msg.reply(`An error occurred. ${MAINTAINERS} have been notified.`);
				msg.client.emit('error', new CommandError(error, msg));
			});
	} catch (error) {
		msg.reply(`An error occurred. ${MAINTAINERS} have been notified.`);
		msg.client.emit('error', new CommandError(error, msg));
	}
}

export default register;
