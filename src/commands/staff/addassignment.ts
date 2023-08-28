import { ApplicationCommandOptionData, ApplicationCommandPermissions, ChatInputCommandInteraction, EmbedField, EmbedBuilder, ApplicationCommandOptionType,
	InteractionResponse } from 'discord.js';
import { Course } from '@lib/types/Course';
import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	// Never assume staff are not dumb (the reason this is so long)

	permissions: ApplicationCommandPermissions[] = [STAFF_PERMS, ADMIN_PERMS];
	description = 'Adds an assignment to a given course ID\'s assignment list';
	runInDM = false;
	options: ApplicationCommandOptionData[] =[
		{
			name: 'course',
			description: 'The course ID to add an assignment to',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'newassignments',
			description: 'A | separated list of new assignments',
			type: ApplicationCommandOptionType.String,
			required: true
		}
	]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const course = interaction.options.getString('course');
		const newAssignments = interaction.options.getString('newassignments').split('|').map(assign => assign.trim());
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
		const embed = new EmbedBuilder()
			.setTitle(`Course ${course}`)
			.addFields(fields)
			.setColor('Gold');

		return interaction.reply({ embeds: [embed] });
	}

}
