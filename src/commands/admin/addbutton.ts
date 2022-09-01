import { BOTMASTER_PERMS } from '@lib/permissions';
import { BOT } from '@root/config';
import { Command } from '@lib/types/Command';
import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, MessageActionRow, MessageButton, MessageButtonStyle, TextChannel } from 'discord.js';

const STYLES = ['primary', 'secondary', 'success', 'danger'];

export default class extends Command {

	description = `Edits a message sent by ${BOT.NAME} to include a button.`;
	permissions: ApplicationCommandPermissionData[] = BOTMASTER_PERMS;

	options: ApplicationCommandOptionData[] = [{
		name: 'msg_link',
		description: 'A message link',
		type: 'STRING',
		required: true
	},
	{
		name: 'label',
		description: 'The button text',
		type: 'STRING',
		required: true
	},
	{
		name: 'custom_id',
		description: 'The button/s custom ID',
		type: 'STRING',
		required: true
	},
	{
		name: 'style',
		description: 'The button\'s style type',
		type: 'STRING',
		required: true,
		choices: STYLES.map((status) => ({
			name: status,
			value: status
		}))
	}]

	async run(interaction: CommandInteraction): Promise<void> {
		const msg = interaction.options.getString('msg_link');
		const buttonLabel = interaction.options.getString('label');
		const customID = interaction.options.getString('custom_id');
		const buttonStyle = interaction.options.getString('style').toUpperCase() as MessageButtonStyle;

		//	for discord canary users, links are different
		const newLink = msg.replace('canary.', '');
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

		const btn = new MessageButton()
			.setLabel(buttonLabel)
			.setCustomId(customID)
			.setStyle(buttonStyle);

		await message.edit({ content: message.content, components: [new MessageActionRow({ components: [btn] })] });
		interaction.reply({ content: 'Your message has been given a button', ephemeral: true });
	}

}
