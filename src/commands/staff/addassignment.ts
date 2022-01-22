import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, EmbedField, Message, MessageEmbed } from 'discord.js';
import { Course } from '@lib/types/Course';
import { ADMIN_PERMS, staffPerms, STAFF_PERMS } from '@lib/permissions';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	// Never assume staff are not dumb (the reason this is so long)

	tempPermissions: ApplicationCommandPermissionData[] = [STAFF_PERMS, ADMIN_PERMS];

	description = 'Adds an assignment to a given course ID\'s assignment list';
	usage = '<course ID>|<assignmentID(s)>';
	runInDM = false;

	options: ApplicationCommandOptionData[] =[
		{
			name: 'course',
			description: 'The course ID to add an assignment to',
			type: 'STRING',
			required: true
		},
		{
			name: 'newassignments',
			description: 'A comma separated list of new assignments',
			type: 'STRING',
			required: true
		}
	]

	permissions(msg: Message): boolean {
		return staffPerms(msg);
	}

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const course = interaction.options.getString('course');
		const newAssignments = interaction.options.getString('newassignments').split(',').map(assign => assign.trim());
		const entry: Course = await interaction.client.mongo.collection(DB.COURSES).findOne({ name: course });

		const added: Array<string> = [];
		const failed: Array<string> = [];
		newAssignments.forEach(assignment => {
			if (entry.assignments.includes(assignment)) {
				failed.push(assignment);
			} else {
				added.push(assignment);
				entry.assignments.push(assignment);
			}
		});

		interaction.client.mongo.collection(DB.COURSES).updateOne({ name: course }, { $set: { ...entry } });

		const fields: Array<EmbedField> = [];
		if (added.length > 0) {
			fields.push({
				name: `Added assignment${added.length === 1 ? '' : 's'}`,
				value: added.join('\n'),
				inline: true
			});
		}
		if (failed.length > 0) {
			fields.push({
				name: `Pre-existing assignment${failed.length === 1 ? '' : 's'}`,
				value: failed.join('\n'),
				inline: true
			});
		}
		const embed = new MessageEmbed()
			.setTitle(`Course ${course}`)
			.addFields(fields)
			.setColor('GOLD');

		return interaction.reply({ embeds: [embed] });
	}

	async run(_msg: Message): Promise<void> { return; }

}
