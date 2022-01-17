import { BOTMASTER_PERMS } from '@lib/permissions';
import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, Message, TextChannel } from 'discord.js';
import { BOT } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Edits a message sent by ${BOT.NAME}.`;
	usage = '<messageLink>|<content>';
	tempPermissions: ApplicationCommandPermissionData[] = [BOTMASTER_PERMS];

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

	async tempRun(interaction: CommandInteraction): Promise<void> {
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
		if (!message.editable) throw 'It seems I can\'t edit that message.';

		await message.edit(content);
		return interaction.reply('I\'ve updated that message.');
	}

	async run(msg: Message, [message, content]: [Message, string]): Promise<Message> {
		await message.edit(content);
		return msg.channel.send('I\'ve updated that message.');
	}

	async argParser(msg: Message, input: string): Promise<[Message, string]> {
		const [link, content] = input.trim().split('|').map(inp => inp.trim());

		if (!link || !content) {
			throw `Usage: ${this.usage}`;
		}

		const newLink = link.replace('canary.', '');
		const match = newLink.match(/https:\/\/discord\.com\/channels\/(\d+)\/(\d+)\/(\d+)/);

		if (!match) throw 'Please provide a valid message link.';

		const [,, channelID, messageID] = match;

		const message = await msg.client.channels.fetch(channelID)
			.then((channel: TextChannel) => channel.messages.fetch(messageID))
			.catch(() => { throw 'I can\'t seem to find that message'; });

		if (!message.editable) throw 'It seems I can\'t edit that message.';

		return [message, content];
	}

}
