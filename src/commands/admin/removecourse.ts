import { ADMIN_PERMS } from '@lib/permissions';
import { DB, GUILDS } from '@root/config';
import { Command } from '@lib/types/Command';
import { Course } from '@lib/types/Course';
import { ApplicationCommandOptionData, ApplicationCommandPermissions, ButtonInteraction, CategoryChannel, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder,
	ApplicationCommandOptionType, InteractionResponse, ButtonStyle, ChannelType, OverwriteResolvable, PermissionFlagsBits } from 'discord.js';
import { updateDropdowns } from '@root/src/lib/utils/generalUtils';

const DECISION_TIMEOUT = 30;
//	Discord's hard cap on how many channels a single category can hold
const MAX_CATEGORY_CHANNELS = 50;
//	the only roles allowed to see archived courses, matched by name without regard to case
const ARCHIVE_ROLES = ['Sage', 'Admin', 'Prof', 'Discord Associate'];

//	every guild role allowed to see archived courses
function archiveRoles(interaction: ChatInputCommandInteraction) {
	const allowed = ARCHIVE_ROLES.map(name => name.toLowerCase());
	return interaction.guild.roles.cache.filter(role => allowed.includes(role.name.toLowerCase()));
}

//	appends _1, _2, ... until the name is free in the destination category
function uniqueName(base: string, taken: Set<string>): string {
	if (!taken.has(base)) return base;
	let suffix = 1;
	while (taken.has(`${base}_${suffix}`)) suffix++;
	return `${base}_${suffix}`;
}

//	`2025_Fall_Archive` is 1, `2025_Fall_Archive_2` is 2, and so on. Anything else is 0
function archiveIndex(channelName: string, baseName: string): number {
	const name = channelName.toLowerCase();
	const base = baseName.toLowerCase();
	if (name === base) return 1;
	if (!name.startsWith(`${base}_`)) return 0;
	const index = Number(name.slice(base.length + 1));
	return Number.isInteger(index) && index > 1 ? index : 0;
}

//	picking an archive category and filling it has to happen as one step, or two removals running at once
//	can both claim the same free slots and the second one dies partway through moving its channels
const archiveQueues = new Map<string, Promise<unknown>>();

function queueOnArchive<T>(name: string, work: () => Promise<T>): Promise<T> {
	const previous = archiveQueues.get(name) ?? Promise.resolve();
	const next = previous.catch(() => undefined).then(work);
	archiveQueues.set(name, next.catch(() => undefined));
	return next;
}

export default class extends Command {

	description = 'Remove a course';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'course',
		description: 'The course ID of the course to be removed (ex: 108).',
		type: ApplicationCommandOptionType.Channel,
		channelTypes: [ChannelType.GuildCategory],
		required: true
	}, {
		name: 'semester',
		description: 'The semester this course ran in; decides which archive category it goes to.',
		type: ApplicationCommandOptionType.String,
		choices: [{ name: 'Fall', value: 'Fall' }, { name: 'Spring', value: 'Spring' }],
		required: true
	}, {
		name: 'year',
		description: 'The year this course ran in (ex: 2025); decides which archive category it goes to.',
		type: ApplicationCommandOptionType.Integer,
		minValue: 2016,
		maxValue: 2099,
		required: true
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		let timeout = DECISION_TIMEOUT;
		const course = interaction.options.getChannel('course') as CategoryChannel;
		const semester = interaction.options.getString('semester');
		const year = interaction.options.getInteger('year');
		//	e.g. `2025_Fall_Archive`, holding channels renamed `f25_108_general`
		const archiveName = `${year}_${semester}_Archive`;
		const semesterPrefix = `${semester === 'Fall' ? 'f' : 's'}${String(year).slice(-2)}`;
		console.log(course.id);

		//	 grabbing course data
		let channelCount;
		try {
			channelCount = course.children.cache.size;
		} catch (error) {
			return interaction.reply('You have to tag a valid course category.');
		}
		//	the record is found by the category's own ID, so the category can be named anything. This also stops an
		//	archive category from being tagged and archived into itself before being deleted
		const registered: Course = await interaction.client.mongo.collection(DB.COURSES)
			.findOne({ 'channels.category': course.id });
		if (!registered) {
			return interaction.reply(`${course} isn't a registered course category. Tag the category of a course that is ` +
			`currently registered, or register this one with \`/registercourse\` first.`);
		}
		const courseId = registered.name;
		const userCount = await interaction.client.mongo.collection(DB.USERS).countDocuments({ courses: courseId });
		const reason = `Removing course \`${course}\` as requested by ` +
		`${interaction.user.tag}\` \`(${interaction.user.id})\``;

		const confirmBtns = [
			new ButtonBuilder({ label: 'Yes', customId: 'y', style: ButtonStyle.Secondary }),
			new ButtonBuilder({ label: 'No', customId: 'n', style: ButtonStyle.Danger })
		];

		//	a warning gets issued for this command
		const baseText = `Are you sure you want to delete ${course}? ` +
		`This action will archive ${channelCount} channels and unenroll ${userCount} users. `;
		await interaction.reply({ content: `${baseText} Press 'yes' in the next 30 seconds to confirm.`, components: [new ActionRowBuilder<ButtonBuilder>({ components: confirmBtns })] });

		//	awaited, so a fast click can't arrive before we know which message to listen to
		const reply = await interaction.fetchReply();
		let decided = false;

		const collector = interaction.channel.createMessageComponentCollector({
			time: DECISION_TIMEOUT * 1000,
			filter: i => i.message.id === reply.id
		});

		const countdown = setInterval(() => this.countdown(interaction, --timeout, confirmBtns, baseText), 1000);

		collector.on('collect', async (i: ButtonInteraction) => {
			if (interaction.user.id !== i.user.id) {
				await i.reply({
					content: 'You cannot respond to a command you did not execute',
					ephemeral: true
				});
				return;
			}

			//	without this a double click would kick off a second removal, and Discord would show the click
			//	as failed because nothing ever answered it
			if (decided) {
				await i.deferUpdate();
				return;
			}
			decided = true;
			collector.stop();
			await i.deferUpdate();

			if (i.customId === 'y') {
				try {
					await interaction.editReply('<a:loading:755121200929439745> working...');

					//	fetching course roles
					await interaction.guild.members.fetch();
					//	from the record rather than by name, so a same-named role left behind by an earlier run of
					//	this course can't be deleted instead of this one's
					const staffRole = interaction.guild.roles.cache.get(registered.roles.staff);
					const studentRole = interaction.guild.roles.cache.get(registered.roles.student);
					const allStaffRole = await interaction.guild.roles.cache.find(role => role.name === 'Staff');
					const profRole = await interaction.guild.roles.cache.find(role => role.name === 'Prof');
					const TARole = await interaction.guild.roles.cache.find(role => role.name === 'TA');
					const LARole = await interaction.guild.roles.cache.find(role => role.name === 'LA');
					//	archving the course channels
					const archive = await queueOnArchive(archiveName, async () => {
						//	the confirmation window gives people time to add channels, so take the list as it is now
						//	and reserve room for exactly what gets moved
						const channels = [...course.children.cache.values()];
						const category = await this.getArchiveCategory(interaction, archiveName, channels.length, reason);
						//	the same course can be archived more than once in a semester, so names already sitting in the
						//	archive get a number appended. Channels this run is moving don't count against themselves
						const moving = new Set(channels.map(channel => channel.id));
						const taken = new Set([...category.children.cache.values()]
							.filter(child => !moving.has(child.id))
							.map(child => child.name));
						for (const channel of channels) {
							//	a retry after a half-finished run shouldn't stack a second prefix on
							const prefixed = channel.name.startsWith(`${semesterPrefix}_`)
								? channel.name
								: `${semesterPrefix}_${channel.name}`;
							const name = uniqueName(prefixed, taken);
							taken.add(name);
							await channel.setParent(category.id, { reason });
							await channel.lockPermissions();
							await channel.setName(name, reason);
						}
						return { category, archived: channels.length };
					});

					for (const [, member] of staffRole?.members ?? []) {
						// removing COURSE SPECIFIC staff role
						if (member.roles.cache.has(staffRole.id)) await member.roles.remove(staffRole.id, reason);
						// check if member is an LA and remove LA role if so
						if (LARole && member.roles.cache.has(LARole.id)) {
							await member.roles.remove(LARole.id, reason);
						}
						// check if member is a TA and remove TA role if so
						if (TARole && member.roles.cache.has(TARole.id)) {
							await member.roles.remove(TARole.id, reason);
						}
						// check if member is a prof, if not, remove Staff role
						if (allStaffRole && member.roles.cache.has(allStaffRole.id) && !member.roles.cache.has(profRole?.id)) {
							await member.roles.remove(allStaffRole.id, reason);
						}
					}
					for (const [, member] of studentRole?.members ?? []) {
						if (member.roles.cache.has(studentRole.id)) await member.roles.remove(studentRole.id, reason);
					}

					// update and remove from database
					await interaction.client.mongo.collection(DB.USERS).updateMany({}, { $pull: { courses: courseId } });
					await interaction.client.mongo.collection(DB.COURSES).findOneAndDelete({ name: courseId });

					await updateDropdowns(interaction);

					await staffRole?.delete(reason);
					await studentRole?.delete(reason);

					//	last, so that a failure anywhere above leaves the category taggable for another run
					await course.delete();

					await interaction.editReply(`${archive.archived} channels archived to ${archive.category.name} ` +
					`and ${userCount} users unenrolled from CISC ${courseId}`);
				} catch (error) {
					interaction.client.emit('error', error);
					interaction.channel.send(`An error occured: ${error.message}`);
				}
			} else {
				await interaction.editReply({
					components: [],
					content: 'Course removal canceled. Nothing has been modified.'
				});
				return;
			}

			await interaction.editReply({
				components: []
			});
		}).on('end', async collected => {
			const validCollected = collected.filter(i => i.isButton()
			&& i.message.id === interaction.id
			&& i.user.id === interaction.user.id);

			clearInterval(countdown);

			if (timeout === 1 && validCollected.size === 0) { // when clearInterval is used, timeout sticks to 1 second
				await interaction.editReply({
					components: [],
					content: 'Command timed out.'
				});
				return;
			}
		});
		return;
	}

	//	finds this semester's archive category, spilling over into `..._2`, `..._3` and so on as each one fills
	async getArchiveCategory(interaction: ChatInputCommandInteraction, baseName: string, needed: number, reason: string): Promise<CategoryChannel> {
		const archives = [...interaction.guild.channels.cache.values()]
			.filter(channel => channel.type === ChannelType.GuildCategory
				&& archiveIndex(channel.name, baseName) > 0)
			.sort((a, b) => archiveIndex(a.name, baseName) - archiveIndex(b.name, baseName)) as CategoryChannel[];

		const existing = archives.find(archive => archive.children.cache.size + needed <= MAX_CATEGORY_CHANNELS);
		if (existing) {
			//	a category made by hand may not match the archive's access rules, and lockPermissions would copy
			//	whatever it has onto the archived staff and private question channels
			const allowed = archiveRoles(interaction);
			await existing.permissionOverwrites.edit(GUILDS.MAIN, { ViewChannel: false }, { reason });
			for (const [, role] of allowed) {
				await existing.permissionOverwrites.edit(role.id, { ViewChannel: true }, { reason });
			}
			//	anyone else holding an explicit view grant would keep seeing the archived staff channels, so drop
			//	just that bit and leave the rest of their overwrites alone
			for (const [, overwrite] of existing.permissionOverwrites.cache) {
				if (overwrite.id === GUILDS.MAIN || allowed.has(overwrite.id)) continue;
				if (overwrite.allow.has(PermissionFlagsBits.ViewChannel)) {
					await existing.permissionOverwrites.edit(overwrite.id, { ViewChannel: null }, { reason });
				}
			}
			return existing;
		}

		const next = archives.length ? archiveIndex(archives[archives.length - 1].name, baseName) + 1 : 1;
		return interaction.guild.channels.create({
			name: next === 1 ? baseName : `${baseName}_${next}`,
			type: ChannelType.GuildCategory,
			permissionOverwrites: this.archiveOverwrites(interaction),
			reason
		});
	}

	//	archived courses keep their staff and private question channels, so the category is closed to everyone else
	archiveOverwrites(interaction: ChatInputCommandInteraction): OverwriteResolvable[] {
		const overwrites: OverwriteResolvable[] = [{
			id: GUILDS.MAIN,
			deny: 'ViewChannel'
		}];
		for (const [, guildRole] of archiveRoles(interaction)) {
			overwrites.push({ id: guildRole.id, allow: 'ViewChannel' });
		}
		return overwrites;
	}

	countdown(interaction: ChatInputCommandInteraction, timeout: number, btns: ButtonBuilder[], baseText: string): void {
		const extraText = timeout > 1
			? `Press 'yes' in the next ${timeout} seconds to confirm.`
			: `Press 'yes' in the next ${timeout} seconds to confirm.`;
		interaction.editReply({ content: baseText +
		extraText, components: [new ActionRowBuilder<ButtonBuilder>({ components: btns })] });
	}


}
