import { MessageEmbed, Role, MessageAttachment, ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction } from 'discord.js';
import { sendToFile } from '@lib/utils';
import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Gives information about a role, including a list of the members who have it.';
	runInDM = false;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'role',
			description: 'Role to get the info of',
			type: 'ROLE',
			required: true
		}
	];
	permissions: ApplicationCommandPermissionData[] = [STAFF_PERMS, ADMIN_PERMS];

	async run(interaction: CommandInteraction): Promise<void> {
		const role = interaction.options.getRole('role') as Role;

		const memberList = role.members || (await interaction.guild.roles.fetch(role.id)).members;

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

}
