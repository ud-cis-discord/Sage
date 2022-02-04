import { BOTMASTER_PERMS } from '@lib/permissions';
import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, TextChannel } from 'discord.js';
import { BOT } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Edits a message sent by ${BOT.NAME}.`;
	usage = '<messageLink>|<content>';
	permissions: ApplicationCommandPermissionData[] = BOTMASTER_PERMS;

	options: ApplicationCommandOptionData[] = [{
		name: 'msg_link',
		description: 'A message link.',
		type: 'STRING',
		required: true
	},
	{
		name: 'msg_content',
		description: 'The updated message content.',
		type: 'STRING',
		required: true
	}]

	async run(interaction: CommandInteraction): Promise<void> {
		const link = interaction.options.getString('msg_link');
		const content = interaction.options.getString('msg_content');

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
		await message.edit(content);
		return interaction.reply('I\'ve updated that message.');
	}

}
