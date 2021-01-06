import { SageClient } from '@root/src/lib/types/SageClient';
import { Message, MessageEmbed } from 'discord.js';


/* Takes one argument, a role name. Sends the current number of users in a
given role and a list of those users. If the list is too long to be sent in an embed,
it should be uploaded to pastebin or similar and a link to the upload should be sent. */

export function run(msg: Message, [roleId]: [string]): Promise<Message> {
	const role = msg.guild.roles.resolve(roleId);

	const memberlist = role.members.map(m => m.user.username).sort().join(', ');

	const embed = new MessageEmbed()
		.setColor(role.hexColor)
		.setTitle('Role Info')
		.addFields([
			{ name: 'Name', value: role.name, inline: true },
			{ name: 'ID', value: role.id, inline: true },
			{ name: 'User Count', value: role.members.size, inline: true },
			{ name: 'Users', value: memberlist, inline: true }
		]);

	return msg.channel.send(embed);
}

export function argParser(msg: Message, input: string): Array<string> {
	const roles = msg.guild.roles.cache.filter(role => role.name === input);

	if (roles.size === 0) {
		throw 'No role with that name exists';
	}

	return [roles.array()[0].id];
}
