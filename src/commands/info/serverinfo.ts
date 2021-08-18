import { Message, MessageEmbed } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Provides information about the UDCIS discord server.';
	aliases = ['serverstats'];
	runInDM = false;

	async run(msg: Message): Promise<Message> {
		const membersWithRoles = msg.guild.members.cache.filter(m => m.roles.cache.size > 1).size;
		const percentage = Math.floor((msg.guild.members.cache.filter(m => m.roles.cache.size > 1).size / msg.guild.memberCount) * 100);

		const embed = new MessageEmbed()
			.addFields([
				{ name: 'Total Members', value: msg.guild.memberCount.toString(), inline: true },
				{ name: 'Humans', value: msg.guild.members.cache.filter(m => !m.user.bot).size.toString(), inline: true },
				{ name: 'Bots', value: msg.guild.members.cache.filter(m => m.user.bot).size.toString(), inline: true },
				{ name: 'Text Channels', value: msg.guild.channels.cache.filter(c => c.type === 'GUILD_TEXT').size.toString(), inline: true },
				{ name: 'Voice Channels', value: msg.guild.channels.cache.filter(c => c.type === 'GUILD_VOICE').size.toString(), inline: true },
				{ name: 'Roles', value: msg.guild.roles.cache.size.toString(), inline: true },
				{ name: 'Emojis', value: msg.guild.emojis.cache.size.toString(), inline: true },
				{ name: 'Members with Roles', value: `${membersWithRoles} (${percentage}%)`, inline: true }
			])
			.setAuthor(msg.guild.name, msg.guild.iconURL())
			.setColor('DARK_VIVID_PINK')
			.setTimestamp();

		return msg.channel.send({ embeds: [embed] });
	}

}
