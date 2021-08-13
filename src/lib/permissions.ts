import { ROLES } from '@root/config';
import { Message, Team } from 'discord.js';

export function staffPerms(msg: Message): boolean {
	return msg.member ? msg.member.roles.cache.has(ROLES.STAFF) : false;
}

export function adminPerms(msg: Message): boolean {
	return msg.member ? msg.member.roles.cache.has(ROLES.ADMIN) : false;
}

export async function botMasterPerms(msg: Message): Promise<boolean> {
	const team = (await msg.client.application).owner as Team;
	return team.members.has(msg.author.id);
}
