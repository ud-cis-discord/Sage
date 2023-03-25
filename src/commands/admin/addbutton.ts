import { BOTMASTER_PERMS } from '@lib/permissions';
import { BOT } from '@root/config';
import { Command } from '@lib/types/Command';
import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandPermissionsBitField, CommandInteraction, ActionRowBuilder, ButtonBuilder, ButtonBuilderStyle, 
	TextChannel, 
	CommandInteractionOptionResolver,
	InteractionResponse} from 'discord.js';

const STYLES = ['primary', 'secondary', 'success', 'danger'];

export default class extends Command {

	description = `Edits a message sent by ${BOT.NAME} to include a button.`;
	permissions: ApplicationCommandPermissionsBitField[] = BOTMASTER_PERMS;

	options: ApplicationCommandOptionData[] = [{
		name: 'msg_link',
		description: 'A message link',
		type: ApplicationCommandOptionType.String,
		required: true
	},
	{
		name: 'label',
		description: 'The button text',
		type: ApplicationCommandOptionType.String,
		required: true
	},
	{
		name: 'custom_id',
		description: 'The button/s custom ID',
		type: ApplicationCommandOptionType.String,
		required: true
	},
	{
		name: 'style',
		description: 'The button\'s style type',
		type: ApplicationCommandOptionType.String,
		required: true,
		choices: STYLES.map((status) => ({
			name: status,
			value: status
		}))
	}]

	async run(interaction: CommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const msg = (interaction.options as CommandInteractionOptionResolver).getString('msg_link');
		const buttonLabel = (interaction.options as CommandInteractionOptionResolver).getString('label');
		const customID = (interaction.options as CommandInteractionOptionResolver).getString('custom_id');
		const buttonStyle = (interaction.options as CommandInteractionOptionResolver).getString('style').toUpperCase() as ButtonBuilderStyle;

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

		const btn = new ButtonBuilder()
			.setLabel(buttonLabel)
			.setCustomId(customID)
			.setStyle(buttonStyle);

		await message.edit({ content: message.content, components: [new ActionRowBuilder({ components: [btn] })] });
		interaction.reply({ content: 'Your message has been given a button', ephemeral: true });
	}

}
