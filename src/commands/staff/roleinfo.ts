import { EmbedBuilder, Role, AttachmentBuilder, ApplicationCommandOptionData, ApplicationCommandPermissions, ChatInputCommandInteraction, ApplicationCommandOptionType,
	InteractionResponse } from 'discord.js';
import { sendToFile } from '@root/src/lib/utils/generalUtils';
import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Gives information about a role, including a list of the members who have it.';
	runInDM = false;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'role',
			description: 'Role to get the info of',
			type: ApplicationCommandOptionType.Role,
			required: true
		}
	];
	permissions: ApplicationCommandPermissions[] = [STAFF_PERMS, ADMIN_PERMS];

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const role = interaction.options.getRole('role') as Role;

		const memberList = role.members || (await interaction.guild.roles.fetch(role.id)).members;

		const memberStrs = memberList.map(m => m.user.username).sort();

		const members = memberStrs.join(', ').length > 1000
			? await sendToFile(memberStrs.join('\n'), 'txt', 'MemberList', true) : memberStrs.join(', ');

		const embed = new EmbedBuilder()
			.setColor(role.color)
			.setTitle(`${role.name} | ${memberList.size} members`)
			.setFooter({ text: `Role ID: ${role.id}` });

		const attachments: AttachmentBuilder[] = [];

		if (members instanceof AttachmentBuilder) {
			embed.addFields({ name: 'Members', value: 'Too many to display, see attached file.' });
			attachments.push(members);
		} else {
			embed.addFields({ name: 'Members', value: memberList.size < 1 ? 'None' : members, inline: true });
		}
		return interaction.reply({ embeds: [embed], files: attachments });
	}

}
