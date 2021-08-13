import { Formatters, Message } from 'discord.js';
import { botMasterPerms } from '@lib/permissions';
import { getCommand } from '@lib/utils';
import { DB } from '@root/config';
import { SageData } from '@lib/types/SageData';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Enable a command.';
	usage = '<command>';

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	async run(msg: Message, [command]: [Command]): Promise<Message> {
		if (command.enabled) return msg.channel.send(`${command.name} is already enabled.`);

		command.enabled = true;
		msg.client.commands.set(command.name, command);

		const { commandSettings } = await msg.client.mongo.collection(DB.CLIENT_DATA).findOne({ _id: msg.client.user.id }) as SageData;
		commandSettings[commandSettings.findIndex(cmd => cmd.name === command.name)] = { name: command.name, enabled: true };
		msg.client.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: msg.client.user.id },
			{ $set: { commandSettings } },
			{ upsert: true }
		);

		return msg.channel.send(Formatters.codeBlock('diff', `+>>> ${command.name} Enabled`,));
	}

	argParser(msg: Message, input: string): Array<Command> {
		const command = getCommand(msg.client, input);

		if (!command) throw `I couldn't find a command called \`${input}\``;

		return [command];
	}

}
