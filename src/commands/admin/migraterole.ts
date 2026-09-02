import {
	ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandPermissions, AttachmentBuilder, ChatInputCommandInteraction,
	EmbedBuilder, GuildMember, InteractionResponse, PermissionFlagsBits, Role
} from 'discord.js';
import { ADMIN_PERMS } from '@lib/permissions';
import { DB, MAINTAINERS } from '@root/config';
import { Command } from '@lib/types/Command';
import { generateErrorEmbed, sendToFile, updateDropdowns } from '@root/src/lib/utils/generalUtils';

// Discord caps embed field values at 1024 characters; past this the failure list moves to an attached file
const MAX_FIELD_LENGTH = 1000;
const PROGRESS_INTERVAL = 10;

export default class extends Command {

	description = 'Moves every member from one role to another and repoints database records at the new role.';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'from',
		description: 'The role to migrate members away from.',
		type: ApplicationCommandOptionType.Role,
		required: true
	}, {
		name: 'to',
		description: 'The role to migrate members onto.',
		type: ApplicationCommandOptionType.Role,
		required: true
	}, {
		name: 'dryrun',
		description: 'Only report what would change, without touching Discord or the database.',
		type: ApplicationCommandOptionType.Boolean,
		required: false
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		// reply first: fetching every member can outlast the 3-second interaction window
		await interaction.reply('<a:loading:755121200929439745> Migrating roles...');
		try {
			await interaction.guild.roles.fetch();
			await interaction.guild.members.fetch();
			const from = interaction.guild.roles.cache.get(interaction.options.getRole('from', true).id);
			const to = interaction.guild.roles.cache.get(interaction.options.getRole('to', true).id);
			const dryRun = interaction.options.getBoolean('dryrun') === true;

			const problem = this.validate(interaction, from, to);
			if (problem) {
				await interaction.editReply({ content: null, embeds: [generateErrorEmbed(problem)] });
				return;
			}

			const members = [...from.members.values()];
			if (dryRun) {
				await this.reportDryRun(interaction, from, to, members);
				return;
			}

			const reason = `Migrating ${from.name} (${from.id}) -> ${to.name} (${to.id}) as requested by ${interaction.user.username} (${interaction.user.id}).`;
			const migrated = await this.migrateMembers(interaction, members, from, to, reason);
			const db = await this.repairDatabase(interaction, from, to);
			await this.report(interaction, from, to, migrated, db);
		} catch (error) {
			interaction.client.emit('error', error);
			await interaction.editReply({
				content: null,
				embeds: [generateErrorEmbed(`Something went wrong while migrating roles. ${MAINTAINERS} have been notified.`)]
			});
		}
	}

	// every reason a migration must not start; all checks run before any write happens
	validate(interaction: ChatInputCommandInteraction, from: Role, to: Role): string | null {
		if (!from || !to) return 'One of those roles does not exist on this server.';
		if (from.id === to.id) return 'The `from` and `to` roles must be different.';
		if (from.id === interaction.guild.id || to.id === interaction.guild.id) return 'You cannot migrate to or from @everyone.';
		if (from.managed || to.managed) return 'Integration-managed roles (bots, boosts, etc.) cannot be migrated.';
		const { me } = interaction.guild.members;
		if (!me.permissions.has(PermissionFlagsBits.ManageRoles)) return 'I do not have the Manage Roles permission.';
		if (me.roles.highest.comparePositionTo(from) <= 0 || me.roles.highest.comparePositionTo(to) <= 0) {
			return `My highest role (${me.roles.highest.name}) must be above both \`${from.name}\` and \`${to.name}\`.`;
		}
		return null;
	}

	async migrateMembers(interaction: ChatInputCommandInteraction, members: GuildMember[], from: Role, to: Role, reason: string): Promise<MigrationResult> {
		const result: MigrationResult = { migrated: 0, alreadyHadTarget: 0, failures: [] };
		for (const [index, member] of members.entries()) {
			try {
				// one API call per member. memberHandler rewrites the user's whole roles array on every role-count change, and two
				// such writes (add, then remove) can land out of order and resurrect `from`; a same-size swap skips that sync
				// entirely, leaving repairDatabase as the only writer. A plain remove fires exactly one sync, which already agrees.
				if (member.roles.cache.has(to.id)) {
					await member.roles.remove(from.id, reason);
					result.alreadyHadTarget++;
				} else {
					await member.roles.set([...member.roles.cache.keys()].filter(id => id !== from.id).concat(to.id), reason);
					result.migrated++;
				}
			} catch (error) {
				result.failures.push(`${member.user.username} (${member.id}): ${error.message}`);
				interaction.client.emit('error', error);
			}
			if ((index + 1) % PROGRESS_INTERVAL === 0) {
				// a failed progress edit must not abort the migration
				await interaction.editReply(`<a:loading:755121200929439745> Migrating roles... ${index + 1}/${members.length} members processed.`).catch(() => null);
			}
		}
		return result;
	}

	// targeted updates so anything still pointing at the old role (unverified users, the course doc, dropdown sources) follows the move
	async repairDatabase(interaction: ChatInputCommandInteraction, from: Role, to: Role): Promise<DatabaseResult> {
		const courses = interaction.client.mongo.collection(DB.COURSES);
		const users = interaction.client.mongo.collection(DB.USERS);
		const assignables = interaction.client.mongo.collection(DB.ASSIGNABLE);

		const studentResult = await courses.updateMany({ 'roles.student': from.id }, { $set: { 'roles.student': to.id } });
		const staffResult = await courses.updateMany({ 'roles.staff': from.id }, { $set: { 'roles.staff': to.id } });
		// $addToSet and $pull cannot target the same field in one update; $addToSet keeps this idempotent for users who already list `to`
		await users.updateMany({ roles: from.id }, { $addToSet: { roles: to.id } });
		const userResult = await users.updateMany({ roles: from.id }, { $pull: { roles: from.id } });
		const assignableResult = await assignables.updateMany({ id: from.id }, { $set: { id: to.id } });

		const result: DatabaseResult = {
			courses: studentResult.modifiedCount + staffResult.modifiedCount,
			users: userResult.modifiedCount,
			assignables: assignableResult.modifiedCount,
			dropdowns: 'Not needed'
		};
		if (result.courses + result.assignables > 0) {
			// the dropdown option values are role IDs read from these collections, so re-render them
			try {
				await updateDropdowns(interaction);
				result.dropdowns = 'Refreshed';
			} catch (error) {
				interaction.client.emit('error', error);
				result.dropdowns = 'Failed to refresh — re-post them via /announce and update ROLE_DROPDOWNS in the config.';
			}
		}
		return result;
	}

	async reportDryRun(interaction: ChatInputCommandInteraction, from: Role, to: Role, members: GuildMember[]): Promise<void> {
		const alreadyHadTarget = members.filter(member => member.roles.cache.has(to.id)).length;
		const courses = interaction.client.mongo.collection(DB.COURSES);
		const courseCount = await courses.countDocuments({ $or: [{ 'roles.student': from.id }, { 'roles.staff': from.id }] });
		const userCount = await interaction.client.mongo.collection(DB.USERS).countDocuments({ roles: from.id });
		const assignableCount = await interaction.client.mongo.collection(DB.ASSIGNABLE).countDocuments({ id: from.id });

		const embed = new EmbedBuilder()
			.setTitle(`Role migration dry run: ${from.name} -> ${to.name}`)
			.setColor('#ffcc00')
			.setDescription('Nothing has been changed.')
			.addFields(
				{ name: 'Members holding the old role', value: `${members.length}`, inline: true },
				{ name: 'Of which already hold the new role', value: `${alreadyHadTarget}`, inline: true },
				{ name: 'Course documents referencing the old role', value: `${courseCount}`, inline: true },
				{ name: 'User documents referencing the old role', value: `${userCount}`, inline: true },
				{ name: 'Assignable role documents referencing the old role', value: `${assignableCount}`, inline: true }
			);
		await interaction.editReply({ content: null, embeds: [embed] });
	}

	async report(interaction: ChatInputCommandInteraction, from: Role, to: Role, migrated: MigrationResult, db: DatabaseResult): Promise<void> {
		const embed = new EmbedBuilder()
			.setTitle(`Role migration: ${from.name} -> ${to.name}`)
			.setColor(migrated.failures.length === 0 ? '#00ff00' : '#ff0000')
			.setDescription(`\`${from.name}\` (${from.id}) was **not** deleted. Delete it manually once you have confirmed these counts.`)
			.addFields(
				{ name: 'Members migrated', value: `${migrated.migrated}`, inline: true },
				{ name: 'Already had the new role (old role removed)', value: `${migrated.alreadyHadTarget}`, inline: true },
				{ name: 'Course documents repointed', value: `${db.courses}`, inline: true },
				{ name: 'User documents repointed', value: `${db.users}`, inline: true },
				{ name: 'Assignable role documents repointed', value: `${db.assignables}`, inline: true },
				{ name: 'Role dropdowns', value: db.dropdowns, inline: true }
			);
		const files: AttachmentBuilder[] = [];
		const failureList = migrated.failures.join('\n');
		if (migrated.failures.length === 0) {
			embed.addFields({ name: 'Failed (0)', value: 'None' });
		} else if (failureList.length > MAX_FIELD_LENGTH) {
			embed.addFields({ name: `Failed (${migrated.failures.length})`, value: 'Too many to display, see attached file. Re-run the command to retry them.' });
			files.push(await sendToFile(failureList, 'txt', 'migraterole_failures', true));
		} else {
			embed.addFields({ name: `Failed (${migrated.failures.length})`, value: `${failureList}\nRe-run the command to retry them.` });
		}
		await interaction.editReply({ content: null, embeds: [embed], files });
	}

}

interface MigrationResult {
	migrated: number;
	alreadyHadTarget: number;
	failures: string[];
}

interface DatabaseResult {
	courses: number;
	users: number;
	assignables: number;
	dropdowns: string;
}
