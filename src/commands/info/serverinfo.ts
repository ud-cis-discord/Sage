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
				{ name: 'Total Members', value: msg.guild.memberCount, inline: true },
				{ name: 'Humans', value: msg.guild.members.cache.filter(m => !m.user.bot).size, inline: true },
				{ name: 'Bots', value: msg.guild.members.cache.filter(m => m.user.bot).size, inline: true },
				{ name: 'Text Channels', value: msg.guild.channels.cache.filter(c => c.type === 'text').size, inline: true },
				{ name: 'Voice Channels', value: msg.guild.channels.cache.filter(c => c.type === 'voice').size, inline: true },
				{ name: 'Roles', value: msg.guild.roles.cache.size, inline: true },
				{ name: 'Emojis', value: msg.guild.emojis.cache.size, inline: true },
				{ name: 'Members with Roles', value: `${membersWithRoles} (${percentage}%)`, inline: true }
			])
			.setAuthor(msg.guild.name, msg.guild.iconURL())
			.setColor('DARK_VIVID_PINK')
			.setTimestamp();

		return msg.channel.send(embed);
	}

}
