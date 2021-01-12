import { Message, MessageEmbed, Role } from 'discord.js';
import { roleParser } from '@lib/arguments';
import { sendToHastebin } from '@lib/utils';
import { staffPerms } from '@lib/permissions';

export const description = 'Gives information about a role, including a list of the members who have it.';
export const usage = '<role>';
export const runInDM = false;

export function permissions(msg: Message): boolean {
	return staffPerms(msg);
}

export async function run(msg: Message, [role]: [Role]): Promise<Message> {
	const memberlist = role.members.map(m => m.user.username).sort();

	const members = memberlist.join(', ').length > 1900 ? await sendToHastebin(memberlist.join('\n')) : memberlist.join(', ');

	const embed = new MessageEmbed()
		.setColor(role.hexColor)
		.setTitle(`${role.name} | ${role.members.size} members`)
		.addField('Members', role.members.size < 1 ? 'None' : members, true)
		.setFooter(`Role ID: ${role.id}`);

	return msg.channel.send(embed);
}

export async function argParser(msg: Message, input: string): Promise<Array<Role>> {
	return [await roleParser(msg, input)];
}
