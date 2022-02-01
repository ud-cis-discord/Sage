import { BOTMASTER_PERMS } from '@lib/permissions';
import { TextChannel, Message, ApplicationCommandPermissionData, CommandInteraction, ApplicationCommandOptionData } from 'discord.js';
import { CHANNELS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Sends an announcement from Sage to a specified channel or announcements if no channel is given.';
	usage = '[channel] | <content>';
	tempPermissions: ApplicationCommandPermissionData[] = [BOTMASTER_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'content',
		description: 'announcement content',
		type: 'STRING',
		required: true
	},
	{
		name: 'image',
		description: 'announcement image url',
		type: 'STRING',
		required: false
	}]

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const channel = interaction.guild.channels.cache.get(CHANNELS.ANNOUNCEMENTS) as TextChannel;
		const content = interaction.options.getString('content');
		const image = interaction.options.getString('image');
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

	run(_msg: Message): Promise<void> { return; }

}
