import { Message, MessageEmbed, Role, MessageAttachment, ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, GuildMember, Collection } from 'discord.js';
import { roleParser } from '@lib/arguments';
import { sendToFile } from '@lib/utils';
import { ADMIN_PERMS, staffPerms, STAFF_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Gives information about a role, including a list of the members who have it.';
	usage = '<role>';
	runInDM = false;

	options: ApplicationCommandOptionData[] = [
		{
			name: 'role',
			description: 'Role to get the info of',
			type: 'ROLE',
			required: true
		}
	];

	tempPermissions: ApplicationCommandPermissionData[] = [STAFF_PERMS, ADMIN_PERMS];

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const role = interaction.options.getRole('role');
		let memberList: Collection<string, GuildMember>;
		// eslint-disable-next-line no-extra-parens
		if ((role as Role).members) {
			// eslint-disable-next-line no-extra-parens
			memberList = (role as Role).members;
		} else {
			memberList = (await interaction.guild.roles.fetch(role.id)).members;
		}

		const memberStrs = memberList.map(m => m.user.username).sort();

		const members = memberStrs.join(', ').length > 1000
			? await sendToFile(memberStrs.join('\n'), 'txt', 'MemberList', true) : memberStrs.join(', ');

		const embed = new MessageEmbed()
			.setColor(role.color)
			.setTitle(`${role.name} | ${memberList.size} members`)
			.setFooter(`Role ID: ${role.id}`);

		const attachments: MessageAttachment[] = [];

		if (members instanceof MessageAttachment) {
			embed.addField('Members', 'Too many to display, see attached file.', true);
			attachments.push(members);
		} else {
			embed.addField('Members', memberList.size < 1 ? 'None' : members, true);
		}
		return interaction.reply({ embeds: [embed], files: attachments });
	}

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

		const attachments: MessageAttachment[] = [];

		if (members instanceof MessageAttachment) {
			embed.addField('Members', 'Too many to display, see attached file.', true);
			attachments.push(members);
		} else {
			embed.addField('Members', role.members.size < 1 ? 'None' : members, true);
		}
		return msg.channel.send({ embeds: [embed], files: attachments });
	}

	async argParser(msg: Message, input: string): Promise<Array<Role>> {
		return [await roleParser(msg, input)];
	}

}
