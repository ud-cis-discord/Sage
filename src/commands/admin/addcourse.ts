import { ApplicationCommandPermissions, ChatInputCommandInteraction, ApplicationCommandOptionData, ApplicationCommandOptionType, InteractionResponse } from 'discord.js';
import { ADMIN_PERMS } from '@lib/permissions';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';
import { createCourse } from '@lib/utils/courseUtils';
import { generateErrorEmbed } from '@lib/utils/generalUtils';

export default class extends Command {

	description = 'Creates a courses category and adds all necessary channels/roles.';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'course',
		description: 'The three-digit course ID of the course to be added (ex: 108).',
		type: ApplicationCommandOptionType.String,
		required: true
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		await interaction.reply('<a:loading:755121200929439745> working...');

		const course = interaction.options.getString('course');

		try {
			//	make sure course does not exist already
			if (await interaction.client.mongo.collection(DB.COURSES).countDocuments({ name: course }) > 0) {
				await interaction.editReply({ content: `${course} has already been registered as a course.` });
				return;
			}

			await createCourse(interaction, course);
		} catch (error) {
			//	this interaction has already been replied to, so the generic handler in commandManager can't
			//	respond to it — without this the loading message would sit there forever
			interaction.client.emit('error', error);
			await interaction.editReply({
				content: null,
				embeds: [generateErrorEmbed(
					`Something went wrong while creating course ${course}. Some roles or channels may have been created; check the server before running this again.`)]
			});
			return;
		}

		await interaction.editReply(`Successfully added course with ID ${course}`);
	}

}
