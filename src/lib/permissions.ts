import { ROLES } from '@root/config';
import { CommandInteraction, Message, Team } from 'discord.js';

export function staffPerms(msg: Message): boolean {
	return msg.member ? msg.member.roles.cache.has(ROLES.STAFF) : false;
}

export function adminPerms(msg: Message): boolean {
	return msg.member ? msg.member.roles.cache.has(ROLES.ADMIN) : false;
}

export function tempAdminPerms(interaction: CommandInteraction): boolean {
	return interaction.member ? interaction.member.roles.cache.has(ROLES.ADMIN) : false;
}

export async function botMasterPerms(msg: Message): Promise<boolean> {
	await msg.client.application.fetch();
	const team = msg.client.application.owner as Team;
	return team.members.has(msg.author.id);
}
