import { CommandInteraction, MessageEmbed } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Provides information about the UDCIS discord server.';
	runInDM = false;

	async run(interaction: CommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const membersWithRoles = interaction.guild.members.cache.filter(m => m.roles.cache.size > 1).size;
		const percentage = Math.floor((interaction.guild.members.cache.filter(m => m.roles.cache.size > 1).size / interaction.guild.memberCount) * 100);

		const embed = new MessageEmbed()
			.addFields([
				{ name: 'Total Members', value: interaction.guild.memberCount.toString(), inline: true },
				{ name: 'Humans', value: interaction.guild.members.cache.filter(m => !m.user.bot).size.toString(), inline: true },
				{ name: 'Bots', value: interaction.guild.members.cache.filter(m => m.user.bot).size.toString(), inline: true },
				{ name: 'Text Channels', value: interaction.guild.channels.cache.filter(c => c.type === 'GUILD_TEXT').size.toString(), inline: true },
				{ name: 'Voice Channels', value: interaction.guild.channels.cache.filter(c => c.type === 'GUILD_VOICE').size.toString(), inline: true },
				{ name: 'Roles', value: interaction.guild.roles.cache.size.toString(), inline: true },
				{ name: 'Emojis', value: interaction.guild.emojis.cache.size.toString(), inline: true },
				{ name: 'Members with Roles', value: `${membersWithRoles} (${percentage}%)`, inline: true }
			])
			.setAuthor(interaction.guild.name, interaction.guild.iconURL())
			.setColor('DARK_VIVID_PINK')
			.setTimestamp();

		return interaction.reply({ embeds: [embed] });
	}

}
