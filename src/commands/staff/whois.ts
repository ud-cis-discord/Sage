import { staffPerms } from '@lib/permissions';
import { userParser } from '@root/src/lib/arguments';
import { GuildMember, Message, MessageEmbed } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';

export const description = 'Gives an overview of a member\'s info.';
export const usage = '<user>';
export const runInDM = false;
export const aliases = ['member'];

export function permissions(msg: Message): boolean {
	return staffPerms(msg);
}

export function run(msg: Message, member: GuildMember): Promise<Message> {
	const roles = member.roles.cache.map(role => role.name).sort().join(', ');

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

	return msg.channel.send(embed);
}

export function argParser(msg: Message, input: string): Promise<GuildMember> {
	if (!input) {
		throw `Usage: ${usage}`;
	}
	return userParser(msg, input);
}
