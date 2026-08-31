import { ApplicationCommandPermissions, ChatInputCommandInteraction, ApplicationCommandOptionData, ApplicationCommandOptionType, InteractionResponse,
	ChannelType, GuildBasedChannel } from 'discord.js';
import { ADMIN_PERMS } from '@lib/permissions';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';
import { Course } from '@lib/types/Course';
import { clearStaleCourse, createCourse } from '@lib/utils/courseUtils';
import { generateErrorEmbed } from '@lib/utils/generalUtils';

//	a channel sitting under one of these belongs to a finished course, so it doesn't block adding the course again
function isArchived(channel: GuildBasedChannel): boolean {
	return Boolean(channel.parent?.name.toLowerCase().includes('archive'));
}

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
		let clearedRoles: string[] = null;

		try {
			//	a course only counts as registered while its category is still in the server; once that's gone
			//	(archived by /removecourse, or deleted by hand) the leftover record just blocks re-adding it
			const existing: Course = await interaction.client.mongo.collection(DB.COURSES).findOne({ name: course });
			if (existing && interaction.guild.channels.cache.has(existing.channels?.category)) {
				await interaction.editReply({ content: `${course} has already been registered as a course.` });
				return;
			}

			//	the record alone isn't proof the course is gone. A category can't sit inside another category, so any
			//	`CISC <id>` category is a live one, and course channels only count as finished once they're in an archive
			const leftover = interaction.guild.channels.cache.find(channel =>
				(channel.type === ChannelType.GuildCategory && channel.name === `CISC ${course}`)
				|| (channel.name.startsWith(`${course.toLowerCase()}_`) && !isArchived(channel)));
			if (leftover) {
				await interaction.editReply({
					content: null,
					embeds: [generateErrorEmbed(`${leftover} already exists outside the archives but isn't registered. ` +
						`Register it with \`/registercourse\`, archive it with \`/removecourse\`, or delete it by hand first.`)]
				});
				return;
			}

			//	every refusal is behind us, so the leftover record can go, along with the enrollments and roles
			//	that pointed at a course which no longer exists
			if (existing) clearedRoles = await clearStaleCourse(interaction, existing);

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

		const lines = [`Successfully added course with ID ${course}`];
		if (clearedRoles) {
			lines.push('A leftover record for this course was cleared first; anyone enrolled before will need to be ' +
				'onboarded again.');
			if (clearedRoles.length) lines.push(`Deleted its orphaned roles: ${clearedRoles.join(', ')}`);
		}
		await interaction.editReply(lines.join('\n'));
	}

}
