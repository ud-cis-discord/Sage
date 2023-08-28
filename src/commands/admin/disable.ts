import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandPermissions, ChatInputCommandInteraction, Formatters,
	InteractionResponse } from 'discord.js';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { getCommand } from '@root/src/lib/utils/generalUtils';
import { SageData } from '@lib/types/SageData';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Disable a command';
	permissions: ApplicationCommandPermissions[] = BOTMASTER_PERMS;

	options: ApplicationCommandOptionData[] = [{
		name: 'command',
		description: 'The name of the command to be disabled.',
		type: ApplicationCommandOptionType.String,
		required: true
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const commandInput = interaction.options.getString('command');
		const command = getCommand(interaction.client, commandInput);

		//	check if command exists or is already disabled
		if (!command) return interaction.reply({ content: `I couldn't find a command called \`${command}\``, ephemeral: true });
		if (command.enabled === false) return interaction.reply({ content: `${command.name} is already disabled.`, ephemeral: true });

		if (command.name === 'enable' || command.name === 'disable') {
			return interaction.reply({ content: 'Sorry fam, you can\'t disable that one.', ephemeral: true });
		}

		command.enabled = false;
		interaction.client.commands.set(command.name, command);

		const { commandSettings } = await interaction.client.mongo.collection(DB.CLIENT_DATA).findOne({ _id: interaction.client.user.id }) as SageData;
		commandSettings[commandSettings.findIndex(cmd => cmd.name === command.name)] = { name: command.name, enabled: false };
		interaction.client.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: interaction.client.user.id },
			{ $set: { commandSettings } },
			{ upsert: true }
		);

		return interaction.reply(Formatters.codeBlock('diff', `->>> ${command.name} Disabled`));
	}

}
