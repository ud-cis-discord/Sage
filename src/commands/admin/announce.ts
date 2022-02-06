import { BOTMASTER_PERMS } from '@lib/permissions';
import { TextChannel, ApplicationCommandPermissionData, CommandInteraction, ApplicationCommandOptionData } from 'discord.js';
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
		name: 'image',
		description: 'The announcement image url',
		type: 'STRING',
		required: false
	}]

	async run(interaction: CommandInteraction): Promise<void> {
		const announceChannel = interaction.guild.channels.cache.get(CHANNELS.ANNOUNCEMENTS);
		const channelOption = interaction.options.getChannel('channel');
		const image = interaction.options.getString('image');
		let content = interaction.options.getString('content');

		const tempMessage = content.split(`\\n`);
		content = tempMessage.join(`\n\n`);

		const channel = (channelOption || announceChannel) as TextChannel;
		await channel.send({
			content: content,
			allowedMentions: { parse: ['everyone', 'roles'] }
		});
		if (image) {
			await channel.send({
				content: image
			});
		}

		return interaction.reply(`Your announcement has been sent in ${channel}`);
	}

}
