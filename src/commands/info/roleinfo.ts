import { Message, MessageEmbed, Role } from 'discord.js';
import fetch from 'node-fetch';
import { roleParser } from '@lib/arguments';
import { ROLES } from '@root/config';

export const description = 'Gives information about a role, including a list of the members who have it.';
export const usage = '<role>';
export const runInDM = false;

export function permissions(msg: Message): boolean {
	return msg.member.roles.cache.has(ROLES.STAFF);
}

export async function run(msg: Message, [role]: [Role]): Promise<Message> {
	let memberlist = role.members.map(m => m.user.username).sort().join(', ');

	memberlist = memberlist.length > 1900 ? await moveToHastebin(memberlist) : memberlist;

	const embed = new MessageEmbed()
		.setColor(role.hexColor)
		.setTitle(`${role.name} | ${role.members.size} members`)
		.addField('Members', role.members.size < 1 ? 'None' : memberlist, true)
		.setFooter(`Role ID: ${role.id}`);

	return msg.channel.send(embed);
}

export async function argParser(msg: Message, input: string): Promise<Array<Role>> {
	return [await roleParser(msg, input)];
}

async function moveToHastebin(memberlist: string): Promise<string> {
	const url = 'https://hastebin.com/documents';
	const retMsg = await fetch(`${url}`, { method: 'POST', body: memberlist }).then(r => r.json());
	return `Result too long for Discord, uploaded to hastebin: <https://hastebin.com/${retMsg.key}.txt>`;
}
