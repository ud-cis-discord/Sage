import { BOTMASTER_PERMS } from '@lib/permissions';
import { channelParser } from '@lib/arguments';
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

	async run(msg: Message, [channel, content]: [TextChannel, string]): Promise<Message> {
		await channel.send({
			content: content,
			files: [...msg.attachments.values()],
			allowedMentions: { parse: ['everyone', 'roles'] }
		});

		return msg.channel.send(`Your announcement has been sent in ${channel}`);
	}

	async argParser(msg: Message, input: string): Promise<[TextChannel, string]> {
		const args = input.trim().split('|');

		if (!args[0] && msg.attachments.size === 0) {
			throw `Usage: ${this.usage}`;
		}

		const channel = args.length > 1 ? args.shift() : null;
		const content = args.join('|');

		const retChannel = channel
			? channelParser(msg, channel) : msg.guild.channels.cache.get(CHANNELS.ANNOUNCEMENTS) as TextChannel;

		return [retChannel, content];
	}

}
