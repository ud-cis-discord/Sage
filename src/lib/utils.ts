import { Command } from './types/Command';
import { SageClient } from './types/SageClient';

export function getCommand(bot: SageClient, cmd: string): Command {
	cmd = cmd.toLowerCase();
	return bot.commands.get(cmd) || bot.commands.find(command => command.aliases && command.aliases.includes(cmd));
}
