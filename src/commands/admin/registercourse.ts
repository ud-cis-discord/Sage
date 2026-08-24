import { ADMIN_PERMS } from '@lib/permissions';
import { DB, GUILDS, ROLES } from '@root/config';
import { Command } from '@lib/types/Command';
import { Course } from '@lib/types/Course';
import { clearStaleCourse, DEFAULT_ASSIGNMENTS, getCoursePerms, withCourseLock } from '@lib/utils/courseUtils';
import { generateErrorEmbed, updateDropdowns } from '@lib/utils/generalUtils';
import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandPermissions, CategoryChannel, ChannelType, ChatInputCommandInteraction,
	InteractionResponse, Role, TextChannel } from 'discord.js';

//	the only channels a course document tracks, and the names /addcourse gives them
interface CourseSlot {
	key: 'general' | 'staff' | 'private';
	option: string;
	suffix: string;
	staffOnly: boolean;
}

const SLOTS: CourseSlot[] = [
	{ key: 'general', option: 'general', suffix: '_general', staffOnly: false },
	{ key: 'staff', option: 'staff', suffix: '_staff', staffOnly: true },
	{ key: 'private', option: 'private_qs', suffix: '_private_qs', staffOnly: true }
];

//	messageCount skips channels whose topic starts with this
const NO_COUNT = '[no message count]';

interface FoundRoles {
	staff?: Role;
	student?: Role;
}

interface AdoptSummary {
	adopted: string[];
	created: string[];
	clearedStale: boolean;
	clearedRoles: string[];
}

export default class extends Command {

	description = 'Registers an existing category as a course, adopting or creating its roles and channels.';
	extendedHelp = 'Use this for a category built by hand. Channels are matched by the usual `<id>_general`, ' +
		'`<id>_staff` and `<id>_private_qs` names; pass the options to point at differently named ones. Anything ' +
		'missing is created. Unlike /addcourse this does not add the untracked homework, labs and projects channels.';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'category',
		description: 'The existing category to register as a course.',
		type: ApplicationCommandOptionType.Channel,
		channelTypes: [ChannelType.GuildCategory],
		required: true
	}, {
		name: 'course',
		description: 'The course ID to register it as (ex: 108).',
		type: ApplicationCommandOptionType.String,
		required: true
	}, {
		name: 'general',
		description: 'The general channel, if it is not named <course>_general.',
		type: ApplicationCommandOptionType.Channel,
		channelTypes: [ChannelType.GuildText],
		required: false
	}, {
		name: 'staff',
		description: 'The staff channel, if it is not named <course>_staff.',
		type: ApplicationCommandOptionType.Channel,
		channelTypes: [ChannelType.GuildText],
		required: false
	}, {
		name: 'private_qs',
		description: 'The private questions channel, if it is not named <course>_private_qs.',
		type: ApplicationCommandOptionType.Channel,
		channelTypes: [ChannelType.GuildText],
		required: false
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		await interaction.reply('<a:loading:755121200929439745> working...');

		const category = interaction.options.getChannel('category') as CategoryChannel;
		const course = interaction.options.getString('course');

		try {
			//	the checks and the writes both run under the lock, so a second run can't pass the same checks
			//	against state the first one is about to change
			//	locked on the category too, or two runs for different IDs could both adopt the same category
			const outcome = await withCourseLock(course, () =>
				withCourseLock(`category:${category.id}`, () => this.register(interaction, category, course)));
			if (typeof outcome === 'string') {
				await interaction.editReply({ content: null, embeds: [generateErrorEmbed(outcome)] });
				return;
			}

			await updateDropdowns(interaction);
			await interaction.editReply(this.report(course, outcome));
		} catch (error) {
			//	this interaction was already replied to, so commandManager cannot answer for us
			interaction.client.emit('error', error);
			await interaction.editReply({
				content: null,
				embeds: [generateErrorEmbed(`Something went wrong while registering ${course}. Some roles or channels may ` +
					`have been created or changed; check the category before running this again.`)]
			});
		}
	}

	//	checks everything first and returns a refusal message, or adopts the category and returns what it did
	async register(interaction: ChatInputCommandInteraction, category: CategoryChannel,
		course: string): Promise<string | AdoptSummary> {
		const courses = interaction.client.mongo.collection(DB.COURSES);

		//	the same definition of registered /addcourse uses: a record only counts while its category is live
		const existing: Course = await courses.findOne({ name: course });
		if (existing && interaction.guild.channels.cache.has(existing.channels?.category)) {
			return `${course} has already been registered as a course.`;
		}

		const owner: Course = await courses.findOne({ 'channels.category': category.id });
		if (owner) {
			return `${category} is already registered as course ${owner.name}.`;
		}

		//	a second category already named after this course would block /addcourse later and leave it unclear
		//	which one is the real thing
		const sameName = interaction.guild.channels.cache.find(channel => channel.type === ChannelType.GuildCategory
			&& channel.id !== category.id && channel.name === `CISC ${course}`);
		if (sameName) {
			return `${sameName} is already named CISC ${course}. Register that category instead, or rename it first.`;
		}

		const staffName = `${course} Staff`;
		const studentName = `CISC ${course}`;
		const staffMatches = [...interaction.guild.roles.cache.filter(role => role.name === staffName).values()];
		const studentMatches = [...interaction.guild.roles.cache.filter(role => role.name === studentName).values()];

		//	sharing a role would let removing either course delete it out from under the other
		for (const role of [...staffMatches, ...studentMatches]) {
			//	excluding this course's own leftover record, whose roles are exactly the ones we mean to adopt
			const boundTo: Course = await courses.findOne({
				name: { $ne: course },
				$or: [{ 'roles.staff': role.id }, { 'roles.student': role.id }]
			});
			if (boundTo) {
				const slot = boundTo.roles.staff === role.id ? 'staff' : 'student';
				return `The role ${role.name} is already course ${boundTo.name}'s ${slot} role, and two courses can't ` +
					`share one \u2014 archiving either course would delete that role out from under the other.\n` +
					`Either rename ${role.name}, and ${course} will get a fresh role of its own, or remove course ` +
					`${boundTo.name} first.`;
			}
		}
		//	adoption picks a role by name, so duplicates leave it ambiguous which one the course would get
		if (staffMatches.length > 1 || studentMatches.length > 1) {
			return `More than one role is named ${staffMatches.length > 1 ? staffName : studentName}. ` +
				`Rename the extras first, or removing this course later could delete the wrong one.`;
		}

		//	resolve every tracked channel before anything is written
		const picks = new Map<string, TextChannel>();
		for (const slot of SLOTS) {
			const override = interaction.options.getChannel(slot.option) as TextChannel;
			if (override && override.parentId !== category.id) {
				return `${override} is not inside ${category}, so archiving the course would leave it behind.`;
			}
			const found = override ?? category.children.cache.find(channel => channel.type === ChannelType.GuildText
				&& channel.name === `${course}${slot.suffix}`.toLowerCase()) as TextChannel;
			if (found) picks.set(slot.key, found);
		}
		const pickedIds = [...picks.values()].map(channel => channel.id);
		if (new Set(pickedIds).size !== pickedIds.length) {
			return 'The general, staff and private question channels all have to be different channels.';
		}

		//	every refusal is behind us, so the leftover record can go, along with the enrollments and any role it
		//	owned that this registration isn't about to adopt
		const adopting = { staff: staffMatches[0], student: studentMatches[0] };
		let clearedRoles: string[] = null;
		if (existing) {
			const keep = new Set([adopting.staff?.id, adopting.student?.id].filter(Boolean));
			clearedRoles = await clearStaleCourse(interaction, existing, keep);
		}

		const summary = await this.adopt(interaction, category, course, picks, adopting);
		summary.clearedStale = Boolean(existing);
		summary.clearedRoles = clearedRoles ?? [];
		return summary;
	}

	//	finds or creates everything the course document needs, then writes it
	async adopt(interaction: ChatInputCommandInteraction, category: CategoryChannel, course: string,
		picks: Map<string, TextChannel>, found: FoundRoles): Promise<AdoptSummary> {
		const reason = `Registering existing category \`${category.name}\` as course \`${course}\` as requested ` +
			`by \`${interaction.user.username}\` \`(${interaction.user.id})\`.`;
		const summary: AdoptSummary = { adopted: [], created: [], clearedStale: false, clearedRoles: [] };

		let staffRole = found.staff;
		if (staffRole) {
			summary.adopted.push(staffRole.name);
		} else {
			staffRole = await interaction.guild.roles.create({
				name: `${course} Staff`,
				permissions: BigInt(0),
				mentionable: true,
				reason
			});
			summary.created.push(staffRole.name);
		}

		let studentRole = found.student;
		if (studentRole) {
			summary.adopted.push(studentRole.name);
		} else {
			studentRole = await interaction.guild.roles.create({
				name: `CISC ${course}`,
				permissions: BigInt(0),
				reason
			});
			summary.created.push(studentRole.name);
		}

		const perms = getCoursePerms(staffRole.id, studentRole.id);
		await this.grantAccess(category, staffRole, studentRole, false, reason);

		const resolved = new Map<string, TextChannel>();
		for (const slot of SLOTS) {
			const picked = picks.get(slot.key);
			if (picked) {
				await this.grantAccess(picked, staffRole, studentRole, slot.staffOnly, reason);
				if (slot.staffOnly && !picked.topic?.startsWith(NO_COUNT)) {
					await picked.setTopic(picked.topic ? `${NO_COUNT} ${picked.topic}` : NO_COUNT, reason);
				}
				resolved.set(slot.key, picked);
				summary.adopted.push(`#${picked.name}`);
				continue;
			}
			const made = await interaction.guild.channels.create({
				name: `${course}${slot.suffix}`,
				type: ChannelType.GuildText,
				parent: category.id,
				topic: slot.staffOnly ? NO_COUNT : undefined,
				permissionOverwrites: slot.staffOnly ? perms.staffPerms : perms.standardPerms,
				reason
			});
			resolved.set(slot.key, made);
			summary.created.push(`#${made.name}`);
		}

		const newCourse: Course = {
			name: course,
			channels: {
				category: category.id,
				general: resolved.get('general').id,
				staff: resolved.get('staff').id,
				private: resolved.get('private').id
			},
			roles: {
				staff: staffRole.id,
				student: studentRole.id
			},
			assignments: [...DEFAULT_ASSIGNMENTS]
		};
		await interaction.client.mongo.collection(DB.COURSES).insertOne(newCourse);

		return summary;
	}

	//	adds the course's access on top of whatever overwrites are already there, so permissions someone set by
	//	hand on an adopted channel survive being registered
	async grantAccess(target: CategoryChannel | TextChannel, staffRole: Role, studentRole: Role, staffOnly: boolean,
		reason: string): Promise<void> {
		await target.permissionOverwrites.edit(ROLES.ADMIN, { ViewChannel: true }, { reason });
		await target.permissionOverwrites.edit(staffRole.id, { ViewChannel: true }, { reason });
		await target.permissionOverwrites.edit(GUILDS.MAIN, { ViewChannel: false }, { reason });
		//	staff channels hang under a category students can see, so leaving them out is not enough to hide them
		await target.permissionOverwrites.edit(studentRole.id, { ViewChannel: !staffOnly }, { reason });
		if (!staffOnly) {
			await target.permissionOverwrites.edit(ROLES.MUTED, { SendMessages: false }, { reason });
		}
	}

	report(course: string, summary: AdoptSummary): string {
		const lines = [`Registered CISC ${course}.`];
		if (summary.adopted.length) lines.push(`Adopted: ${summary.adopted.join(', ')}`);
		if (summary.created.length) lines.push(`Created: ${summary.created.join(', ')}`);
		if (summary.clearedStale) lines.push('A leftover record for this course was cleared first.');
		if (summary.clearedRoles.length) lines.push(`Deleted its orphaned roles: ${summary.clearedRoles.join(', ')}`);
		lines.push('Nobody is enrolled yet; run /onboardcourse with the roster to enroll people.');
		return lines.join('\n');
	}

}
