import fetch from 'node-fetch';
import { Command } from './types/Command';
import { SageClient } from './types/SageClient';

export function getCommand(bot: SageClient, cmd: string): Command {
	cmd = cmd.toLowerCase();
	return bot.commands.get(cmd) || bot.commands.find(command => command.aliases && command.aliases.includes(cmd));
}

export async function sendToHastebin(input: string, filetype = 'txt'): Promise<string> {
	if (input.length < 1900) return input;

	const res = await fetch('https://hastebin.com/documents', { method: 'POST', body: input }).then(r => r.json());
	return `Result too long for Discord, uploaded to hastebin: <https://hastebin.com/${res.key}.${filetype}>`;
}
