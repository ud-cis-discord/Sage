import { Formatters, Message } from 'discord.js';
import { botMasterPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { DB } from '@root/config';
import { getCommand } from '@lib/utils';
import { SageData } from '@lib/types/SageData';

export default class extends Command {

	description = 'Unrestrict a command, so that it can be used in any channel.';
	usage = '<command>';
	alias = 'unres';

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	async run(msg: Message, [command]: [Command]): Promise<Message> {
		if (!command.restricted) throw msg.channel.send(`${command.name} is already unrestricted.`);
		command.restricted = false;
		msg.client.commands.set(command.name, command);

		//	database jargon
		const { commandSettings } = await msg.client.mongo.collection(DB.CLIENT_DATA).findOne({ _id: msg.client.user.id }) as SageData;
		commandSettings[commandSettings.findIndex(cmd => cmd.name === command.name)] = { name: command.name, enabled: command.enabled, restricted: false };
		msg.client.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: msg.client.user.id },
			{ $set: { commandSettings } },
			{ upsert: true }
		);

		return msg.channel.send(Formatters.codeBlock('ini', `[ ${command.name} unrestricted ]`));
	}

	argParser(msg: Message, input: string): Array<Command> {
		const command = getCommand(msg.client, input);

		if (!command) throw `I couldn't find a command called \`${input}\``;

		return [command];
	}

}
