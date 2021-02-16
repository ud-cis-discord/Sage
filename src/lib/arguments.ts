import { Message, Role, GuildMember, TextChannel, Collection } from 'discord.js';

export async function roleParser(msg: Message, input: string): Promise<Role> {
	input = input.replace(/<@&(\d+)>/, '$1').trim();

	const role = await msg.guild.roles.fetch(input);
	if (role) {
		return role;
	}

	const roleList = msg.guild.roles.cache.filter(r => r.name.toLowerCase() === input.toLowerCase());
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
	if (retMembers.size !== 1) {
		retMembers = gMembers.filter(member => member.user.username.toLowerCase() === input);
		if (retMembers.size !== 1) {
			retMembers = gMembers.filter(member => member.nickname ? member.nickname.toLowerCase() === input : false);
		}
	}

	if (retMembers.size < 1) {
		throw 'No member with that username, nickname, or ID exists.';
	}
	if (retMembers.size > 1) {
		throw 'Multiple members with that username or nickname exist, try entering an ID to get a specific user';
	}

	return retMembers.array()[0];
}

export function channelParser(msg: Message, input: string): TextChannel {
	input = input.replace(/<#!?(\d+)>/, '$1').trim().toLowerCase();

	const gChannels: Collection<string, TextChannel> = msg.guild.channels.cache
		.filter(channel => (channel.type === 'text' || channel.type === 'news')
		&& (channel.id === input || channel.name === input))as Collection<string, TextChannel>;

	if (!gChannels) {
		throw 'No channel with that ID exists';
	}

	if (gChannels.size > 1) {
		throw 'More than one channel with that name exists. Please specify a channel ID.';
	}

	return gChannels.first();
}
