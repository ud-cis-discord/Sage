import { BOTMASTER_PERMS } from '@lib/permissions';
import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, MessageActionRow, Modal, ModalActionRowComponent, TextChannel, TextInputComponent } from 'discord.js';
import { BOT } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Edits a message sent by ${BOT.NAME}.`;
	usage = '<messageLink>|<content>';
	permissions: ApplicationCommandPermissionData[] = BOTMASTER_PERMS;

	options: ApplicationCommandOptionData[] = [{
		name: 'msg_link',
		description: 'A message link',
		type: 'STRING',
		required: true
	}]

	async run(interaction: CommandInteraction): Promise<void> {
		const link = interaction.options.getString('msg_link');

		//	for discord canary users, links are different
		const newLink = link.replace('canary.', '');
		const match = newLink.match(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);
		if (!match) return interaction.reply('Please provide a valid message link.');

		//	find the message
		const [,, channelID, messageID] = match;
		const message = await interaction.client.channels.fetch(channelID)
			.then((channel: TextChannel) => channel.messages.fetch(messageID))
			.catch(() => { throw 'I can\'t seem to find that message'; });

		// check if the message can be edited
		if (!message.editable) {
			return interaction.reply(
				{ content: `It seems I can't edit that message. You'll need to tag a message that was sent by me, ${BOT.NAME}`,
					ephemeral: true });
		}

		const modal = new Modal()
			.setTitle('Edit')
			.setCustomId('edit');

		const contentsComponent = new TextInputComponent()
			.setCustomId('content')
			.setLabel('New message content')
			.setStyle('PARAGRAPH')
			.setRequired(true);

		const messageComponent = new TextInputComponent()
			.setCustomId('message')
			.setLabel('ID of message to be edited (auto-filled)')
			.setStyle('SHORT')
			.setRequired(true)
			.setValue(message.id);

		const channelComponent = new TextInputComponent()
			.setCustomId('channel')
			.setLabel('The channel this message is in (auto-filled)')
			.setStyle('SHORT')
			.setRequired(true)
			.setValue(message.channelId);

		const modalRows: MessageActionRow<ModalActionRowComponent>[] = [
			new MessageActionRow<ModalActionRowComponent>().addComponents(contentsComponent),
			new MessageActionRow<ModalActionRowComponent>().addComponents(messageComponent),
			new MessageActionRow<ModalActionRowComponent>().addComponents(channelComponent)
		];
		modal.addComponents(...modalRows);

		await interaction.showModal(modal);
	}

}
