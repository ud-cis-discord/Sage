import { Message, Role } from 'discord.js';

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
