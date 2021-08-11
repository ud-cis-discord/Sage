import { Message } from 'discord.js';
import { botMasterPerms } from '@lib/permissions';
import { getCommand } from '@lib/utils';
import { SageData } from '@lib/types/SageData';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Disable a command';
	usage = '<command>';

	permissions(msg: Message): Promise<boolean> {
		return botMasterPerms(msg);
	}

	async run(msg: Message, [command]: [Command]): Promise<Message> {
		if (command.enabled === false) return msg.channel.send(`${command.name} is already disabled.`);

		if (command.name === 'enable' || command.name === 'disable') {
			return msg.channel.send('Sorry fam, you can\'t disable that one.');
		}

		command.enabled = false;
		msg.client.commands.set(command.name, command);

		const { commandSettings } = await msg.client.mongo.collection(DB.CLIENT_DATA).findOne({ _id: msg.client.user.id }) as SageData;
		commandSettings[commandSettings.findIndex(cmd => cmd.name === command.name)] = { name: command.name, enabled: false };
		msg.client.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: msg.client.user.id },
			{ $set: { commandSettings } },
			{ upsert: true }
		);

		return msg.channel.send(`->>> ${command.name} Disabled`, { code: 'diff' });
	}

	argParser(msg: Message, input: string): Array<Command> {
		const command = getCommand(msg.client, input);

		if (!command) throw `I couldn't find a command called \`${input}\``;

		return [command];
	}

}
