import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandPermissions, ChatInputCommandInteraction, InteractionResponse } from 'discord.js';
import { AssignableRole } from '@lib/types/AssignableRole';
import { ADMIN_PERMS } from '@lib/permissions';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';
import { updateDropdowns } from '@root/src/lib/utils/generalUtils';

export default class extends Command {

	description = `Adds a role to the assignable collection of the database, or removes it if it's there already`;
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'role',
		description: 'The role to add to the list of self-assignable roles.',
		type: ApplicationCommandOptionType.Role,
		required: true
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const apiRole = interaction.options.getRole('role');
		const role = await interaction.guild.roles.fetch(apiRole.id);

		const assignables = interaction.client.mongo.collection(DB.ASSIGNABLE);
		const newRole: AssignableRole = { id: role.id };

		if (await assignables.countDocuments(newRole) > 0) {
			await interaction.reply('Removing role...');
			const responseMsg = `The role \`${role.name}\` has been removed.`;
			await assignables.findOneAndDelete(newRole);
			await updateDropdowns(interaction);
			interaction.editReply(responseMsg);
		} else {
			await interaction.reply('Adding role...');
			await assignables.insertOne(newRole);
			await updateDropdowns(interaction);
			interaction.editReply(`The role \`${role.name}\` has been added.`);
			return;
		}
	}

}
