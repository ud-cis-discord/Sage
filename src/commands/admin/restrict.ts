import { Message, Formatters } from 'discord.js';
import { adminPerms, botMasterPerms, staffPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { DB } from '@root/config';
import { getCommand } from '@lib/utils';
import { SageData } from '@lib/types/SageData';


export default class extends Command {

	description = 'Restrict a command to #sages_place';
	usage = '<command>';
	alias = ['res'];

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	async run(msg: Message, [command]: [Command]): Promise<Message> {
		if (command.restricted) throw msg.channel.send(`${command.name} is already restricted.`);
		command.restricted = true;
		msg.client.commands.set(command.name, command);

		//	database jargon
		const { commandSettings } = await msg.client.mongo.collection(DB.CLIENT_DATA).findOne({ _id: msg.client.user.id }) as SageData;
		commandSettings[commandSettings.findIndex(cmd => cmd.name === command.name)] = { name: command.name, enabled: command.enabled, restricted: true };
		msg.client.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: msg.client.user.id },
			{ $set: { commandSettings } },
			{ upsert: true }
		);

		return msg.channel.send(Formatters.codeBlock('css', `[ ${command.name} Restricted ]`));
	}

	argParser(msg: Message, input: string): Array<Command> {
		const command = getCommand(msg.client, input);

		if (!command) throw `I couldn't find a command called \`${input}\``;

		if (command.permissions === staffPerms || command.permissions === adminPerms || command.permissions === botMasterPerms) {
			throw 'This command cannot be restricted.';
		}

		return [command];
	}

}
