import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, Message } from 'discord.js';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { getCommand } from '@root/src/lib/utils';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Allows you always to run other commands by overriding permission, ' +
	'disabled command, and command location checks.';
	enabled = false;
	tempPermissions: ApplicationCommandPermissionData[] = [BOTMASTER_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'command',
		description: 'The command you would like to sudo run.',
		type: 'STRING',
		required: true
	},
	{
		name: 'args',
		description: 'The args for the sudo-run command, ' +
		'it can be a comma separated list of args or a single arg.',
		type: 'STRING',
		required: true
	}]

	async tempRun(interaction: CommandInteraction): Promise<unknown> {
		const commandName = interaction.options.getString('command');
		const command = getCommand(interaction.client, commandName);
		if (!command) throw `Invalid command name: \`${commandName}\``;

		//	const arg = interaction.options.getString('args');
		//	const args = arg ? arg.split(', ') : [];

		return command.tempRun(interaction);
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
