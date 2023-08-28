import { ChannelType, ChatInputCommandInteraction, EmbedBuilder, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Provides information about the UDCIS discord server.';
	runInDM = false;

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const membersWithRoles = interaction.guild.members.cache.filter(m => m.roles.cache.size > 1).size;
		const percentage = Math.floor((interaction.guild.members.cache.filter(m => m.roles.cache.size > 1).size / interaction.guild.memberCount) * 100);

		const embed = new EmbedBuilder()
			.addFields([
				{ name: 'Total Members', value: interaction.guild.memberCount.toString(), inline: true },
				{ name: 'Humans', value: interaction.guild.members.cache.filter(m => !m.user.bot).size.toString(), inline: true },
				{ name: 'Bots', value: interaction.guild.members.cache.filter(m => m.user.bot).size.toString(), inline: true },
				{ name: 'Text Channels', value: interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildText).size.toString(), inline: true },
				{ name: 'Voice Channels', value: interaction.guild.channels.cache.filter(c => c.type === ChannelType.GuildVoice).size.toString(), inline: true },
				{ name: 'Roles', value: interaction.guild.roles.cache.size.toString(), inline: true },
				{ name: 'Emojis', value: interaction.guild.emojis.cache.size.toString(), inline: true },
				{ name: 'Members with Roles', value: `${membersWithRoles} (${percentage}%)`, inline: true }
			])
			.setAuthor({ name: interaction.guild.name, iconURL: interaction.guild.iconURL() })
			.setColor('DarkVividPink')
			.setTimestamp();

		return interaction.reply({ embeds: [embed] });
	}

}
