import { EmbedField, ChatInputCommandInteraction, EmbedBuilder, version as discordVersion, InteractionResponse } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { version as sageVersion } from '@root/package.json';
import { BOT } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Displays info about Sage\'s current status';

	async run(interaction:ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const fields: Array<EmbedField> = [];
		const bot = interaction.client;

		fields.push({
			name: 'Users',
			value: `${bot.users.cache.size}`,
			inline: true
		});
		fields.push({
			name: 'Channels',
			value: `${bot.channels.cache.size}`,
			inline: true
		});
		fields.push({
			name: 'Servers',
			value: `${bot.guilds.cache.size}`,
			inline: true
		});
		fields.push({
			name: 'Uptime',
			value: prettyMilliseconds(bot.uptime),
			inline: true
		});
		fields.push({
			name: 'Memory Usage',
			value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
			inline: true
		});
		fields.push({
			name: 'Sage Version',
			value: `v${sageVersion}`,
			inline: false
		});
		fields.push({
			name: 'Discord.js Version',
			value: `v${discordVersion}`,
			inline: true
		});

		const embed = new EmbedBuilder()
			.setColor('DarkGreen')
			.setAuthor({ name: `${BOT.NAME} Stats`, iconURL: bot.user.displayAvatarURL() })
			.setThumbnail(bot.user.displayAvatarURL())
			.setTimestamp(Date.now())
			.addFields(fields);

		return interaction.reply({ embeds: [embed] });
	}

}
