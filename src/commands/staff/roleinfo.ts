import { Message, MessageEmbed, Role, MessageAttachment } from 'discord.js';
import { roleParser } from '@lib/arguments';
import { sendToFile } from '@lib/utils';
import { staffPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Gives information about a role, including a list of the members who have it.';
	usage = '<role>';
	runInDM = false;

	permissions(msg: Message): boolean {
		return staffPerms(msg);
	}

	async run(msg: Message, [role]: [Role]): Promise<Message> {
		const memberList = role.members.map(m => m.user.username).sort();

		const members = memberList.join(', ').length > 1000
			? await sendToFile(memberList.join('\n'), 'txt', 'MemberList', true) : memberList.join(', ');

		const embed = new MessageEmbed()
			.setColor(role.hexColor)
			.setTitle(`${role.name} | ${role.members.size} members`)
			.setFooter(`Role ID: ${role.id}`);

		if (members instanceof MessageAttachment) {
			embed.addField('Members', 'Too many to display, see attached file.', true);
			embed.attachFiles([members]);
		} else {
			embed.addField('Members', role.members.size < 1 ? 'None' : members, true);
		}
		return msg.channel.send({ embeds: [embed] });
	}

	async argParser(msg: Message, input: string): Promise<Array<Role>> {
		return [await roleParser(msg, input)];
	}

}
