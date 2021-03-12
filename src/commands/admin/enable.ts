import { Message } from 'discord.js';
import { botMasterPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { getCommand } from '@lib/utils';

export const description = 'Enable a command.';
export const usage = '<command>';

export async function permissions(msg: Message): Promise<boolean> {
	return await botMasterPerms(msg);
}

export function run(msg: Message, [command]: [Command]): Promise<Message> {
	if (command.enabled) return msg.channel.send(`${command.name} is already enabled.`);

	command.enabled = true;
	msg.client.commands.set(command.name, command);

	return msg.channel.send(`+>>> ${command.name} Enabled`, { code: 'diff' });
}

export function argParser(msg: Message, input: string): Array<Command> {
	const command = getCommand(msg.client, input);

	if (!command) throw `I couldn't find a command called \`${input}\``;

	return [command];
}
