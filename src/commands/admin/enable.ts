import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandPermissions, ChatInputCommandInteraction, Formatters,
	InteractionResponse } from 'discord.js';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { getCommand } from '@root/src/lib/utils/generalUtils';
import { DB } from '@root/config';
import { SageData } from '@lib/types/SageData';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Enable a command.';
	usage = '<command>';
	permissions: ApplicationCommandPermissions[] = BOTMASTER_PERMS;

	options: ApplicationCommandOptionData[] = [{
		name: 'command',
		description: 'The name of the command to be enabled.',
		type: ApplicationCommandOptionType.String,
		required: true
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const commandInput = interaction.options.getString('command');
		const command = getCommand(interaction.client, commandInput);

		//	check if command exists or is already enabled
		if (!command) return interaction.reply({ content: `I couldn't find a command called \`${command}\``, ephemeral: true });
		if (command.enabled) return interaction.reply({ content: `${command.name} is already enabled.`, ephemeral: true });

		command.enabled = true;
		interaction.client.commands.set(command.name, command);

		const { commandSettings } = await interaction.client.mongo.collection(DB.CLIENT_DATA).findOne({ _id: interaction.client.user.id }) as SageData;
		commandSettings[commandSettings.findIndex(cmd => cmd.name === command.name)] = { name: command.name, enabled: true };
		interaction.client.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: interaction.client.user.id },
			{ $set: { commandSettings } },
			{ upsert: true }
		);

		return interaction.reply(Formatters.codeBlock('diff', `+>>> ${command.name} Enabled`));
	}

}
