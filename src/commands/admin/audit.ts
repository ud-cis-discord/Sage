import {
	ApplicationCommandPermissions, AttachmentBuilder, ChatInputCommandInteraction, Collection, EmbedBuilder,
	InteractionResponse, NonThreadGuildBasedChannel, Role, Snowflake
} from 'discord.js';
import { ADMIN_PERMS } from '@lib/permissions';
import { DB, MAINTAINERS } from '@root/config';
import { Command } from '@lib/types/Command';
import { Course } from '@lib/types/Course';
import { SageUser } from '@lib/types/SageUser';
import { AssignableRole } from '@lib/types/AssignableRole';
import { generateErrorEmbed, sendToFile } from '@root/src/lib/utils/generalUtils';

// Discord caps embed field values at 1024 characters; past this a section moves to the attached file
const MAX_FIELD_LENGTH = 1000;

// a stored ID that isn't snowflake-shaped is corrupt, not deleted — report it distinctly
const SNOWFLAKE_REGEX = /^\d{17,20}$/;
const isSnowflake = (id: string): boolean => typeof id === 'string' && SNOWFLAKE_REGEX.test(id);

type LiveChannels = Collection<Snowflake, NonThreadGuildBasedChannel | null>;
type LiveRoles = Collection<Snowflake, Role>;

export default class extends Command {

	description = 'Reports drift between the database and the Discord server. Changes nothing.';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		// reply first: the guild and database fetches below can outlast the 3-second interaction window
		await interaction.reply('<a:loading:755121200929439745> Auditing the database against the server...');
		try {
			// one bulk fetch each instead of a REST call per stored ID
			const channels = await interaction.guild.channels.fetch();
			const roles = await interaction.guild.roles.fetch();
			const courses: Course[] = await interaction.client.mongo.collection(DB.COURSES).find().toArray();
			const assignables: AssignableRole[] = await interaction.client.mongo.collection(DB.ASSIGNABLE).find().toArray();
			const users: SageUser[] = await interaction.client.mongo.collection(DB.USERS)
				.find({ courses: { $exists: true, $ne: [] } }, { projection: { courses: 1 } }).toArray();

			const courseDrift = this.auditCourses(courses, channels, roles);
			const assignableDrift = this.auditAssignables(assignables, roles);
			const enrollmentDrift = this.auditEnrollments(users, courses);

			if (courseDrift.length + assignableDrift.length + enrollmentDrift.length === 0) {
				await interaction.editReply('No drift found between the database and the Discord server.');
				return;
			}
			await this.report(interaction, courseDrift, assignableDrift, enrollmentDrift);
		} catch (error) {
			interaction.client.emit('error', error);
			await interaction.editReply({
				content: null,
				embeds: [generateErrorEmbed(`Something went wrong while auditing. ${MAINTAINERS} have been notified.`)]
			});
		}
	}

	auditCourses(courses: Course[], channels: LiveChannels, roles: LiveRoles): string[] {
		const lines: string[] = [];
		for (const course of courses) {
			const checks: Array<[string, string, LiveChannels | LiveRoles]> = [
				['category channel', course.channels?.category, channels],
				['general channel', course.channels?.general, channels],
				['staff channel', course.channels?.staff, channels],
				['private channel', course.channels?.private, channels],
				['student role', course.roles?.student, roles],
				['staff role', course.roles?.staff, roles]
			];
			const missing: string[] = [];
			for (const [label, id, live] of checks) {
				if (!id) missing.push(`${label} (not set)`);
				else if (!isSnowflake(id)) missing.push(`${label} (invalid value)`);
				else if (!live.has(id)) missing.push(`${label} (${id} deleted)`);
			}
			if (missing.length > 0) lines.push(`CISC ${course.name || '(unnamed doc)'}: ${missing.join(', ')}`);
		}
		return lines;
	}

	auditAssignables(assignables: AssignableRole[], roles: LiveRoles): string[] {
		const lines: string[] = [];
		for (const assignable of assignables) {
			if (!assignable.id) lines.push('Document with no role ID');
			else if (!isSnowflake(assignable.id)) lines.push('Document with an invalid role ID');
			else if (!roles.has(assignable.id)) lines.push(`Role ${assignable.id} no longer exists on the server`);
		}
		return lines;
	}

	auditEnrollments(users: SageUser[], courses: Course[]): string[] {
		const knownCourses = new Set(courses.map(course => course.name));
		const orphans = new Map<string, number>();
		for (const user of users) {
			for (const name of user.courses || []) {
				if (!knownCourses.has(name)) orphans.set(name, (orphans.get(name) || 0) + 1);
			}
		}
		return [...orphans.entries()]
			.sort(([, countA], [, countB]) => countB - countA)
			.map(([name, count]) => `"${name}" — ${count} user${count === 1 ? '' : 's'} still enrolled`);
	}

	async report(interaction: ChatInputCommandInteraction, courseDrift: string[], assignableDrift: string[], enrollmentDrift: string[]): Promise<void> {
		const embed = new EmbedBuilder()
			.setTitle('Database / Discord drift audit')
			.setColor('#ff0000')
			.setDescription('Report only — nothing has been changed.');
		const overflow: string[] = [];
		const sections: Array<[string, string[]]> = [
			['Courses with missing Discord objects', courseDrift],
			['Assignable roles pointing at deleted roles', assignableDrift],
			['Enrollments in nonexistent courses', enrollmentDrift]
		];
		for (const [title, sectionLines] of sections) {
			const value = sectionLines.length === 0 ? 'None' : sectionLines.join('\n');
			if (value.length > MAX_FIELD_LENGTH) {
				embed.addFields({ name: `${title} (${sectionLines.length})`, value: 'Too many to display, see attached file.' });
				overflow.push(`${title}\n${sectionLines.join('\n')}`);
			} else {
				embed.addFields({ name: `${title} (${sectionLines.length})`, value });
			}
		}
		const files: AttachmentBuilder[] = overflow.length > 0
			? [await sendToFile(overflow.join('\n\n'), 'txt', 'audit_report', true)]
			: [];
		await interaction.editReply({ content: null, embeds: [embed], files });
	}

}
