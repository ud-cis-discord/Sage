import { Message } from 'discord.js';
import { adminPerms, botMasterPerms, staffPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { CHANNELS } from '@root/config';
import { getCommand } from '@root/src/lib/utils';


export default class extends Command {

	description = 'Restrict a command to #sages_place';
	usage = '<command>';

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	async run(msg: Message, [command]: [Command]): Promise<Message> {
		if (command.restricted) {
			command.restricted = false;
			msg.client.commands.set(command.name, command);
			return msg.channel.send(`${command.name} has been unrestricted. It can now be used in any channel.`);
		}
		command.restricted = true;
		msg.client.commands.set(command.name, command);
		return msg.channel.send(`${command.name} has been restricted to <#${CHANNELS.SAGE}>.`);
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
