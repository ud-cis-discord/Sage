import { Message } from 'discord.js';
import { botMasterPerms } from '@lib/permissions';
import { getCommand } from '@root/src/lib/utils';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Allows you always to run other commands.';
	extendedHelp = 'Sudo bypasses permission checks, disabled command checks and command location checks.';
	usage = '<command> [args]';

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	async run(msg: Message, [command, unparsedArgs]: [Command, string]): Promise<unknown> {
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

		return command.run(msg, args);
	}

	argParser(msg: Message, input: string): [Command, string] {
		const commandName = input.split(' ')[0];
		const command = getCommand(msg.client, commandName);
		if (!command) throw `sudo: Invalid command name: \`${commandName}\``;

		const args = input.slice(commandName.length, input.length).trim();

		return [command, args];
	}

}
