import { BOTMASTER_PERMS } from '@lib/permissions';
import { TextChannel, ApplicationCommandPermissionData, CommandInteraction, ApplicationCommandOptionData, MessageAttachment } from 'discord.js';
import { CHANNELS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Sends an announcement from Sage to a specified channel or announcements if no channel is given.';
	permissions: ApplicationCommandPermissionData[] = BOTMASTER_PERMS;

	options: ApplicationCommandOptionData[] = [{
		name: 'channel',
		description: 'The channel to send the announcement in.',
		type: 'CHANNEL',
		required: true
	},
	{
		name: 'content',
		description: `The announcement content. Adding in \n will add in a line break.`,
		type: 'STRING',
		required: true
	},
	{
		name: 'file',
		description: 'A file to be posted with the announcement',
		type: 'ATTACHMENT',
		required: false
	}]

	async run(interaction: CommandInteraction): Promise<void> {
		const announceChannel = interaction.guild.channels.cache.get(CHANNELS.ANNOUNCEMENTS);
		const channelOption = interaction.options.getChannel('channel');
		const file = interaction.options.getAttachment('file');
		let content = interaction.options.getString('content');

		const tempMessage = content.split(`\\n`);
		content = tempMessage.join(`\n`);

		const channel = (channelOption || announceChannel) as TextChannel;
		await channel.send({
			content: content,
			files: [file.url],
			allowedMentions: { parse: ['everyone', 'roles'] }
		});

		return interaction.reply(`Your announcement has been sent in ${channel}`);
	}

}
