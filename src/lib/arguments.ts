import { Message, Role, GuildMember } from 'discord.js';

export async function roleParser(msg: Message, input: string): Promise<Role> {
	input = input.replace(/<@&(\d+)>/, '$1').trim();

	const role = await msg.guild.roles.fetch(input);
	if (role) {
		return role;
	}

	const roleList = msg.guild.roles.cache.filter(r => r.name === input);
	if (roleList.size === 0) {
		throw 'No role with that name or ID exists.';
	}
	if (roleList.size > 1) {
		throw 'Multiple roles with that name exist. Lookup by ID for role information.';
	}
	return roleList.array()[0];
}

export async function userParser(msg: Message, input: string): Promise<GuildMember> {
	input = input.replace(/<@!?(\d+)>/, '$1').trim().toLowerCase();

	const gMembers = await msg.guild.members.fetch();

	let retMembers = gMembers.filter(member => member.user.id === input);
	if (retMembers.size === 1) {
		return retMembers.array()[0];
	}

	retMembers = gMembers.filter(member => member.user.username.toLowerCase() === input);

	if (retMembers.size < 1) {
		throw 'No member with that username or ID exists.';
	}
	if (retMembers.size > 1) {
		throw 'Multiple members with that username exist, enter ID to get a specific user';
	}

	return retMembers.array()[0];
}
