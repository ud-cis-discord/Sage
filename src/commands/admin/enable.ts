import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, Formatters, Message } from 'discord.js';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { getCommand } from '@lib/utils';
import { DB } from '@root/config';
import { SageData } from '@lib/types/SageData';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Enable a command.';
	usage = '<command>';
	tempPermissions: ApplicationCommandPermissionData[] = [BOTMASTER_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'command',
		description: 'The name of the command to be enabled.',
		type: 'STRING',
		required: true
	}]

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const commandInput = interaction.options.getString('command');
		const command = getCommand(interaction.client, commandInput);

		//	check if command exists or is already enabled
		if (!command) return interaction.reply(`I couldn't find a command called \`${command}\``);
		if (command.enabled) return interaction.reply(`${command.name} is already enabled.`);

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

	async run(msg: Message, [command]: [Command]): Promise<Message> {
		if (command.enabled) return msg.channel.send(`${command.name} is already enabled.`);

		command.enabled = true;
		msg.client.commands.set(command.name, command);

		const { commandSettings } = await msg.client.mongo.collection(DB.CLIENT_DATA).findOne({ _id: msg.client.user.id }) as SageData;
		commandSettings[commandSettings.findIndex(cmd => cmd.name === command.name)] = { name: command.name, enabled: true };
		msg.client.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: msg.client.user.id },
			{ $set: { commandSettings } },
			{ upsert: true }
		);

		return msg.channel.send(Formatters.codeBlock('diff', `+>>> ${command.name} Enabled`));
	}

	argParser(msg: Message, input: string): Array<Command> {
		const command = getCommand(msg.client, input);

		if (!command) throw `I couldn't find a command called \`${input}\``;

		return [command];
	}

}
