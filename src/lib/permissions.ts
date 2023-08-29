import { ROLES } from '@root/config';
import { ApplicationCommandPermissionData, CommandInteraction, Message, Team } from 'discord.js';

export function staffPerms(msg: Message): boolean {
	return msg.member ? msg.member.roles.cache.has(ROLES.STAFF) : false;
}

export function adminPerms(msg: Message): boolean {
	return msg.member ? msg.member.roles.cache.has(ROLES.ADMIN) : false;
}

export async function botMasterPerms(msg: Message): Promise<boolean> {
	await msg.client.application.fetch();
	const team = msg.client.application.owner as Team;
	return team.members.has(msg.author.id);
}

export async function tempBotMasterPerms(interaction: CommandInteraction): Promise<string> {
	await interaction.client.application.fetch();
	const team = interaction.client.application.owner as Team;
	return team.members.has(interaction.user.id) ? interaction.user.id : 'ID not found';
}

export const STAFF_PERMS: ApplicationCommandPermissionData = {
	id: ROLES.STAFF,
	permission: true,
	type: 'ROLE'
};

export const ADMIN_PERMS: ApplicationCommandPermissionData = {
	id: ROLES.ADMIN,
	permission: true,
	type: 'ROLE'
};

export let BOTMASTER_PERMS: ApplicationCommandPermissionData[];

export function setBotmasterPerms(data: ApplicationCommandPermissionData[]): void {
	BOTMASTER_PERMS = data;
}
