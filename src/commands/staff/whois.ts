import { ADMIN_PERMS, staffPerms, STAFF_PERMS } from '@lib/permissions';
import { userParser } from '@root/src/lib/arguments';
import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, GuildMember, Message, MessageEmbed } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Gives an overview of a member\'s info.';
	usage = '<user>';
	runInDM = false;
	aliases = ['member'];

	options: ApplicationCommandOptionData[] = [
		{
			name: 'user',
			description: 'The user to lookup',
			type: 'USER',
			required: true
		}
	];

	tempPermissions: ApplicationCommandPermissionData[] = [STAFF_PERMS, ADMIN_PERMS];

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const user = interaction.options.getUser('user');
		const member = await interaction.guild.members.fetch(user.id);

		const roles = member.roles.cache.size > 1
			? [...member.roles.cache.filter(r => r.id !== r.guild.id).sort().values()].join(' ')
			: 'none';

		const accountCreated = `${member.user.createdAt.getMonth()}/${member.user.createdAt.getDate()}/${member.user.createdAt.getFullYear()} 
		(${prettyMilliseconds(Date.now() - member.user.createdTimestamp)} ago)`;

		const memberSince = `${member.joinedAt.getMonth()}/${member.joinedAt.getDate()}/${member.joinedAt.getFullYear()}
		(${prettyMilliseconds(Date.now() - member.joinedTimestamp)} ago)`;

		const embed = new MessageEmbed()
			.setAuthor(`${member.user.username}`, member.user.displayAvatarURL())
			.setColor(member.displayColor)
			.setTimestamp()
			.setFooter(`Member ID: ${member.id}`)
			.addFields([
				{ name: 'Display Name', value: `${member.displayName} (<@${member.id}>)`, inline: true },
				{ name: 'Account Created', value: accountCreated, inline: true },
				{ name: 'Joined Server', value: memberSince, inline: true },
				{ name: 'Roles', value: roles, inline: true }
			]);

		return interaction.reply({ embeds: [embed] });
	}

	permissions(msg: Message): boolean {
		return staffPerms(msg);
	}

	run(msg: Message, [member]: [GuildMember]): Promise<Message> {
		const roles = member.roles.cache.size > 1
			? [...member.roles.cache.filter(r => r.id !== r.guild.id).sort().values()].join(' ')
			: 'none';

		const accountCreated = `${member.user.createdAt.getMonth()}/${member.user.createdAt.getDate()}/${member.user.createdAt.getFullYear()} 
		(${prettyMilliseconds(Date.now() - member.user.createdTimestamp)} ago)`;

		const memberSince = `${member.joinedAt.getMonth()}/${member.joinedAt.getDate()}/${member.joinedAt.getFullYear()}
		(${prettyMilliseconds(Date.now() - member.joinedTimestamp)} ago)`;

		const embed = new MessageEmbed()
			.setAuthor(`${member.user.username}`, member.user.displayAvatarURL())
			.setColor(member.displayColor)
			.setTimestamp()
			.setFooter(`Member ID: ${member.id}`)
			.addFields([
				{ name: 'Display Name', value: `${member.displayName} (<@${member.id}>)`, inline: true },
				{ name: 'Account Created', value: accountCreated, inline: true },
				{ name: 'Joined Server', value: memberSince, inline: true },
				{ name: 'Roles', value: roles, inline: true }
			]);

		return msg.channel.send({ embeds: [embed] });
	}

	async argParser(msg: Message, input: string): Promise<Array<GuildMember>> {
		if (!input) {
			throw `Usage: ${this.usage}`;
		}

		return [await userParser(msg, input)];
	}

}
