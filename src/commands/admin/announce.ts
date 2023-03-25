import { BOTMASTER_PERMS } from '@lib/permissions';
import { TextChannel, ApplicationCommandPermissions, CommandInteraction, ApplicationCommandOptionData, Modal, TextInputComponent, MessageActionRow, ModalActionRowComponent } from 'discord.js';
import { CHANNELS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Sends an announcement from Sage to a specified channel or announcements if no channel is given.';
	permissions: ApplicationCommandPermissions[] = BOTMASTER_PERMS;

	options: ApplicationCommandOptionData[] = [{
		name: 'channel',
		description: 'The channel to send the announcement in',
		type: 'CHANNEL',
		required: true
	},
	{
		name: 'file',
		description: 'A file to be posted with the announcement',
		type: 'ATTACHMENT',
		required: false
	}]

	async run(interaction: CommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const announceChannel = interaction.guild.channels.cache.get(CHANNELS.ANNOUNCEMENTS);
		const channelOption = (interaction.options as CommandInteractionOptionResolver).getChannel('channel');
		const file = (interaction.options as CommandInteractionOptionResolver).getAttachment('file');

		const channel = (channelOption || announceChannel) as TextChannel;

		const modal = new Modal()
			.setTitle('Announce')
			.setCustomId('announce');

		const contentsComponent = new TextInputComponent()
			.setCustomId('content')
			.setLabel('Content to send with this announcement')
			.setStyle('PARAGRAPH')
			.setRequired(true);

		const channelComponent = new TextInputComponent()
			.setCustomId('channel')
			.setLabel('ID of receiving channel (auto-filled)')
			.setStyle('SHORT')
			.setRequired(true)
			.setValue(channel.id);

		const fileComponent = new TextInputComponent()
			.setCustomId('file')
			.setLabel('URL to attached file (auto-filled)')
			.setStyle('SHORT')
			.setRequired(false)
			.setValue(file ? file.url : '');

		const modalRows: MessageActionRow<ModalActionRowComponent>[] = [
			new MessageActionRow<ModalActionRowComponent>().addComponents(contentsComponent),
			new MessageActionRow<ModalActionRowComponent>().addComponents(channelComponent),
			new MessageActionRow<ModalActionRowComponent>().addComponents(fileComponent)
		];
		modal.addComponents(...modalRows);

		await interaction.showModal(modal);
	}

}
