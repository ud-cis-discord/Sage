import { Collection, Client, CommandInteraction, ApplicationCommandPermissionData } from 'discord.js';
import { readdirRecursive } from '@lib/utils';
import { Command } from '@lib/types/Command';
import { SageData } from '@lib/types/SageData';
import { DB, GUILDS, ROLES } from '@root/config';

const DEFAULT_PERMS: ApplicationCommandPermissionData[] = [{
	id: ROLES.VERIFIED,
	type: 'ROLE',
	permission: true
}];

async function register(bot: Client): Promise<void> {
	try {
		await loadCommands(bot);
	} catch (error) {
		bot.emit('error', error);
	}

	bot.on('interactionCreate', interaction => {
		if (interaction.isCommand()) runCommand(interaction, bot);
	});
}

async function loadCommands(bot: Client) {
	bot.commands = new Collection();
	const sageData = await bot.mongo.collection(DB.CLIENT_DATA).findOne({ _id: bot.user.id }) as SageData;
	const oldCommandSettings = sageData?.commandSettings || [];
	bot.guilds.cache.get(GUILDS.MAIN).commands.fetch();
	const { commands } = bot.guilds.cache.get(GUILDS.MAIN);

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

		let guildCmd = commands.cache.find(cmd => cmd.name === command.name);

		const cmdData = {
			name: command.name,
			description: command.category,
			options: command?.options,
			defaultPermission: false
		};

		if (!guildCmd) {
			guildCmd = await commands.create(cmdData);
			console.log(`${command.name} does not exist, creating...`);
		} else {
			await commands.edit(guildCmd.id, cmdData);
			console.log(`${command.name} already exists, editing...`);
		}
		guildCmd.permissions.add({ permissions: command.tempPermissions || DEFAULT_PERMS });

		const oldSettings = oldCommandSettings.find(cmd => cmd.name === command.name);
		let enable: boolean;
		if (oldSettings) {
			enable = oldSettings.enabled;
		} else {
			enable = command.enabled !== false;
			oldCommandSettings.push({ name: command.name, enabled: enable });
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

async function runCommand(interaction: CommandInteraction, bot: Client): Promise<void> {
	const command = bot.commands.get(interaction.commandName);
	if (interaction.channel.type === 'DM' && !command.runInDM) {
		return interaction.reply('This command cannot be run in DMs');
	}

	if (interaction.channel.type === 'GUILD_TEXT' && !command.runInGuild) {
		return interaction.reply({
			content: 'This command must be run in DMs, not public channels',
			ephemeral: true
		});
	}

	if (bot.commands.get(interaction.commandName).tempRun !== undefined) return bot.commands.get(interaction.commandName)?.tempRun(interaction);
	else return interaction.reply('We haven\'t switched that one over yet');
	// interaction.reply(interaction.commandName);
	// if ((!msg.content.toLowerCase().startsWith(PREFIX) && msg.channel.type !== 'DM') || msg.author.bot) return;

	// let commandName: string;
	// if (msg.channel.type !== 'DM' || msg.content.toLowerCase().startsWith(PREFIX)) {
	// 	[commandName] = msg.content.slice(PREFIX.length).trim().split(' ');
	// } else {
	// 	[commandName] = msg.content.split(' ');
	// }
	// const unparsedArgs = msg.content.slice(msg.content.indexOf(commandName) + commandName.length, msg.content.length).trim();

	// const command = getCommand(msg.client, commandName);
	// if (!command || command.enabled === false) return;

	// if (msg.channel.type === 'DM' && command.runInDM === false) return msg.reply(`${command.name} is not available in DMs.`);
	// if (msg.channel.type === 'GUILD_TEXT' && command.runInGuild === false) {
	// 	await msg.author.send(`<@!${msg.author.id}>, the command you just tried to run is not available in public channels. Try again in DMs.`)
	// 		.catch(async () => { await msg.reply('That command is not available here, try again in DMs'); });
	// 	return msg.delete();
	// }

	// if (command.permissions && !await command.permissions(msg)) return msg.reply('Missing permissions');

	// let args: Array<unknown>;
	// if (command.argParser) {
	// 	try {
	// 		args = await command.argParser(msg, unparsedArgs);
	// 	} catch (error) {
	// 		msg.channel.send(error);
	// 		return;
	// 	}
	// } else {
	// 	args = [unparsedArgs];
	// }

	// try {
	// 	command.run(msg, args)
	// 		?.catch(async (error: Error) => {
	// 			msg.reply(`An error occurred. ${MAINTAINERS} have been notified.`);
	// 			msg.client.emit('error', new CommandError(error, msg));
	// 		});
	// } catch (error) {
	// 	msg.reply(`An error occurred. ${MAINTAINERS} have been notified.`);
	// 	msg.client.emit('error', new CommandError(error, msg));
	// }
}

export default register;
