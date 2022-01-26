import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, Message, Role } from 'discord.js';
import { AssignableRole } from '@lib/types/AssignableRole';
import { roleParser } from '@lib/arguments';
import { ADMIN_PERMS } from '@lib/permissions';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';
import { modifyRoleDD } from '@root/src/lib/utils';

export default class extends Command {

	description = `Adds a role to the assignable collection of the database, or removes it if it's there already`;
	usage = '<role>';
	runInDM = false;
	tempPermissions: ApplicationCommandPermissionData[] = [ADMIN_PERMS];
	options: ApplicationCommandOptionData[] = [{
		name: 'role',
		description: 'The role to add to assignables.',
		type: 'ROLE',
		required: true
	}]

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const apiRole = interaction.options.getRole('role');
		const role = await interaction.guild.roles.fetch(apiRole.id);

		const assignables = interaction.client.mongo.collection(DB.ASSIGNABLE);
		const newRole: AssignableRole = { id: role.id };

		if (await assignables.countDocuments(newRole) > 0) {
			/* if (!await modifyRoleDD(interaction, role, false, 'REMOVE')) {
				return interaction.reply('Unable to remove role from dropdown menu.');
			}*/
			assignables.findOneAndDelete(newRole);
			return interaction.reply(`The role \`${role.name}\` has been removed.`);
		} else {
			if (!await modifyRoleDD(interaction, role, false, 'ADD')) {
				return interaction.reply('Unable to add role to dropdown menu,');
			}
			assignables.insertOne(newRole);
			return interaction.reply(`The role \`${role.name}\` has been added.`);
		}
	}

	async run(msg: Message, [cmd]: [Role]): Promise<Message> {
		const assignables = msg.client.mongo.collection(DB.ASSIGNABLE);
		const newRole: AssignableRole = { id: cmd.id };

		if (await assignables.countDocuments(newRole) > 0) {
			assignables.findOneAndDelete(newRole);
			return msg.channel.send(`The role \`${cmd.name}\` has been removed.`);
		} else {
			assignables.insertOne(newRole);
			return msg.channel.send(`The role \`${cmd.name}\` has been added.`);
		}
	}

	async argParser(msg: Message, input: string): Promise<Array<Role>> {
		return [await roleParser(msg, input)];
	}

}
