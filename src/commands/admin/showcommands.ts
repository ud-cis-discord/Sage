import { ApplicationCommandPermissionData, CommandInteraction, Formatters, Message } from 'discord.js';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Show all commands, including disable commands.';
	tempPermissions: ApplicationCommandPermissionData[] = BOTMASTER_PERMS;

	async tempRun(interaction: CommandInteraction): Promise<void> {
		let commands = '+ Enabled\n- Disabled\n';

		interaction.client.commands.forEach(command => {
			commands += `\n${command.enabled === false ? '-' : '+'} ${command.name}`;
		});

		return interaction.reply(Formatters.codeBlock('diff', commands));
	}

	run(_msg: Message): Promise<void> { return; }

}
