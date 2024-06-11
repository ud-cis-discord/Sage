import { BOTMASTER_PERMS } from '@lib/permissions';
import { ApplicationCommandOptionData, ApplicationCommandPermissions, ChatInputCommandInteraction, ActionRowBuilder, ModalActionRowComponentBuilder, TextChannel,
	TextInputBuilder, ApplicationCommandOptionType, InteractionResponse, ModalBuilder, TextInputStyle } from 'discord.js';
import { BOT } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Edits a message sent by ${BOT.NAME}.`;
	usage = '<messageLink>|<content>';
	permissions: ApplicationCommandPermissions[] = BOTMASTER_PERMS;

	options: ApplicationCommandOptionData[] = [{
		name: 'msg_link',
		description: 'A message link',
		type: ApplicationCommandOptionType.String,
		required: true
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
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

		const modal = new ModalBuilder()
			.setTitle('Edit')
			.setCustomId('edit');

		const contentsComponent = new TextInputBuilder()
			.setCustomId('content')
			.setLabel('New message content')
			.setStyle(TextInputStyle.Paragraph)
			.setRequired(true);

		const messageComponent = new TextInputBuilder()
			.setCustomId('message')
			.setLabel('ID of message to be edited (auto-filled)')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setValue(message.id);

		const channelComponent = new TextInputBuilder()
			.setCustomId('channel')
			.setLabel('The channel this message is in (auto-filled)')
			.setStyle(TextInputStyle.Short)
			.setRequired(true)
			.setValue(message.channelId);

		const modalRows: ActionRowBuilder<ModalActionRowComponentBuilder>[] = [
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(contentsComponent),
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(messageComponent),
			new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(channelComponent)
		];
		modal.addComponents(...modalRows);

		await interaction.showModal(modal);
	}

}
