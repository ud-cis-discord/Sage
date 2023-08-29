import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction } from 'discord.js';
import { AssignableRole } from '@lib/types/AssignableRole';
import { ADMIN_PERMS } from '@lib/permissions';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';
import { modifyRoleDD } from '@root/src/lib/utils/generalUtils';

export default class extends Command {

	description = `Adds a role to the assignable collection of the database, or removes it if it's there already`;
	runInDM = false;
	permissions: ApplicationCommandPermissionData[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'role',
		description: 'The role to add to the list of self-assignable roles.',
		type: 'ROLE',
		required: true
	}]

	async run(interaction: CommandInteraction): Promise<void> {
		const apiRole = interaction.options.getRole('role');
		const role = await interaction.guild.roles.fetch(apiRole.id);

		const assignables = interaction.client.mongo.collection(DB.ASSIGNABLE);
		const newRole: AssignableRole = { id: role.id };

		if (await assignables.countDocuments(newRole) > 0) {
			await interaction.reply('Removing role...');
			let responseMsg = `The role \`${role.name}\` has been removed.`;
			if (!await modifyRoleDD(interaction, role, false, 'REMOVE')) {
				responseMsg = `The role \`${role.name}\` has been removed. However, I couldn't remove it from the assignables dropdown (it probably wasn't on there to begin with)`;
			}
			await assignables.findOneAndDelete(newRole);
			interaction.editReply(responseMsg);
		} else {
			await interaction.reply('Adding role...');
			if (!await modifyRoleDD(interaction, role, false, 'ADD')) {
				return;
			}
			await assignables.insertOne(newRole);
			interaction.editReply(`The role \`${role.name}\` has been added.`);
			return;
		}
	}

}
