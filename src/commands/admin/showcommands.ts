import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, Formatters, Message } from 'discord.js';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Show all commands, including disable commands.';
	tempPermissions: ApplicationCommandPermissionData[] = [BOTMASTER_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'restricted',
		description: 'Use this argument to see the list of restricted commands.',
		type: 'BOOLEAN',
		required: false
	}]

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const restricted = interaction.options.getBoolean('restricted');
		if (restricted) {
			/*
			let commands = '[ Restricted ]\n.Unrestricted\n';
			interaction.client.commands.forEach(command => {
				commands += `\n${command.restricted === true ? `[ ${command.name} ]` : `.${command.name}`} `;
			});
			return interaction.reply(Formatters.codeBlock('css', commands));
			*/
			return interaction.reply('restricted works');
		}
		let commands = '+ Enabled\n- Disabled\n';

		interaction.client.commands.forEach(command => {
			commands += `\n${command.enabled === false ? '-' : '+'} ${command.name}`;
		});

		return interaction.reply(Formatters.codeBlock('diff', commands));
	}

	run(_msg: Message): Promise<void> { return; }

}
