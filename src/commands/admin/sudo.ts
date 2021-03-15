import { Message } from 'discord.js';
import { botMasterPerms } from '@lib/permissions';
import { Command } from '@root/src/lib/types/Command';
import { getCommand } from '@root/src/lib/utils';

export const description = 'Allows you always to run other commands.';
export const extendedHelp = 'Sudo bypasses permission checks, disabled command checks and command location checks.';
export const usage = '<command> [args]';

export async function permissions(msg: Message): Promise<boolean> {
	return await botMasterPerms(msg);
}

export async function run(msg: Message, [command, unparsedArgs]: [Command, string]): Promise<Message> {
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

export function argParser(msg: Message, input: string): [Command, string] {
	const commandName = input.split(' ')[0];
	const command = getCommand(msg.client, commandName);
	if (!command) throw `sudo: Invalid command name: \`${commandName}\``;

	const args = input.slice(commandName.length, input.length).trim();

	return [command, args];
}

