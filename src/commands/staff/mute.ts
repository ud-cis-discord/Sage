import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { MAINTAINERS, ROLES } from '@root/config';
import { ApplicationCommandPermissions, ChatInputCommandInteraction, ApplicationCommandOptionData, ApplicationCommandOptionType, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Gives the muted role to the given user.';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [STAFF_PERMS, ADMIN_PERMS];
	options: ApplicationCommandOptionData[] = [
		{
			name: 'user',
			description: 'The user to mute',
			type: ApplicationCommandOptionType.User,
			required: true
		}
	]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const user = interaction.options.getUser('user');
		const member = await interaction.guild.members.fetch(user.id);

		if (!member) {
			interaction.reply({
				content: `Something went wrong. Please contact ${MAINTAINERS} for help. You can give the user the <@&${ROLES.MUTED}> role manually as a quick fix.`,
				ephemeral: true
			});
			throw new Error('Could not find member based on passed in user');
		}

		if (member.roles.cache.has(ROLES.MUTED)) {
			const reason = `${member.user.username} was un-muted by ${interaction.user.tag} (${interaction.user.id})`;
			await member.roles.remove(ROLES.MUTED, reason);
			return interaction.reply({ content: `${member.user.username} has been un-muted.`, ephemeral: true });
		}
		const reason = `${member.user.username} was muted by ${interaction.user.tag} (${interaction.user.id})`;
		await member.roles.add(ROLES.MUTED, reason);

		let muteMsg = `${member.user.username} has been muted.`;

		await member.send(`You have been muted on the UD CIS Discord Server by ${interaction.user.tag}.
If you believe this to be a problem, please reach out to them directly.`).catch(() => {
			muteMsg += '\n\nThis user has DMs disabled, please make sure to let them know why this happened.';
			return;
		});

		return interaction.reply({ content: muteMsg, ephemeral: true });
	}

}
