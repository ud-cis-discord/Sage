import { roleParser } from '@root/src/lib/arguments';
import { Message, MessageEmbed } from 'discord.js';
import fetch from 'node-fetch';


/* Takes one argument, a role name. Sends the current number of users in a
given role and a list of those users. If the list is too long to be sent in an embed,
it should be uploaded to pastebin or similar and a link to the upload should be sent. */

export async function run(msg: Message, [roleId]: [string]): Promise<Message> {
	const role = msg.guild.roles.resolve(roleId);

	let memberlist = role.members.map(m => m.user.username).sort().join(', ');

	memberlist = memberlist.length > 1900 ? await moveToHastebin(memberlist) : memberlist;

	const embed = new MessageEmbed()
		.setColor(role.hexColor)
		.setTitle(`${role.name} | ${role.members.size} members`)
		.addField('Members', role.members.size < 1 ? 'None' : memberlist, true)
		.setFooter(`Role ID: ${role.id}`);

	return msg.channel.send(embed);
}

export async function argParser(msg: Message, input: string): Promise<Array<string>> {
	return roleParser(msg, input);
}

async function moveToHastebin(memberlist: string): Promise<string> {
	const url = 'https://hastebin.com/documents';
	const retMsg = await fetch(`${url}`, { method: 'POST', body: memberlist }).then(r => r.json());
	return `Result too long for Discord, uploaded to hastebin: <https://hastebin.com/${retMsg.key}.js>`;
}
