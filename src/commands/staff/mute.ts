import { staffPerms } from '@lib/permissions';
import { ROLES } from '@root/config';
import { userParser } from '@lib/arguments';
import { Message, GuildMember } from 'discord.js';

export const description = 'Gives the muted role to the given user.';
export const usage = '<user>';
export const runInDM = false;

export function permissions(msg: Message): boolean {
	return staffPerms(msg);
}

export async function run(msg: Message, [member]: [GuildMember]): Promise<Message> {
	if (member.roles.cache.has(ROLES.MUTED)) {
		const reason = `${member.user.username} was un-muted by ${msg.author.tag} (${msg.author.id})`;
		member.roles.remove(ROLES.MUTED, reason);
		return msg.channel.send(`${member.user.username} has been un-muted.`);
	}
	const reason = `${member.user.username} was muted by ${msg.author.tag} (${msg.author.id})`;
	member.roles.add(ROLES.MUTED, reason);
	return msg.channel.send(`${member.user.username} has been muted.`);
}

export async function argParser(msg: Message, input: string): Promise<Array<GuildMember>> {
	return [await userParser(msg, input)];
}
