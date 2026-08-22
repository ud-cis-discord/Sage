import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandPermissions, Attachment, ChatInputCommandInteraction } from 'discord.js';
import nodemailer from 'nodemailer';
import fetch from 'node-fetch';
import { ADMIN_PERMS } from '@lib/permissions';
import { DB, MAINTAINERS } from '@root/config';
import { Command } from '@lib/types/Command';
import { Course } from '@lib/types/Course';
import { createCourse } from '@lib/utils/courseUtils';
import { onboardUser, sendOnboardEmail, sleep } from '@lib/utils/onboardUtils';
import { generateErrorEmbed, sendToFile } from '@lib/utils/generalUtils';

const MAX_FILE_SIZE = 1000000;
//	capped so a worst-case all-new roster (1.1s spacing + SMTP time per email) stays well inside
//	Discord's 15-minute interaction token lifetime
const MAX_ROSTER_SIZE = 300;
const FETCH_TIMEOUT = 10000;
const EMAIL_DELAY = 1100;
const PROGRESS_INTERVAL = 50;
const EMAIL_REGEX = /^[^\s@,]+@udel\.edu$/;
const HEADER_REGEX = /^(staff|student)\s*,\s*(\S+)$/i;

interface RosterParse {
	emails: Array<string>;
	invalid: Array<string>;
	headerError?: string;
}

interface OnboardTally {
	created: Array<string>;
	skipped: Array<string>;
	restaffed: Array<string>;
	verifiedStaff: Array<string>;
	emailFailed: Array<string>;
}

//	prevents two onboarding runs from racing each other's user lookups/inserts within the bot process
let onboardRunning = false;

export default class extends Command {

	description = 'Onboards a course roster: creates the course if needed, adds users, and emails invites.';
	extendedHelp = 'The roster is a .csv or .txt file with one udel.edu email per line. A legacy STUDENT/STAFF,course header line is' +
		' allowed but must match the command options. Re-uploading a roster is safe: already-onboarded users are skipped.';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'course',
		description: 'The three-digit course ID of the course to onboard (ex: 108).',
		type: ApplicationCommandOptionType.String,
		required: true
	}, {
		name: 'roletype',
		description: 'Whether the roster contains students or staff (TAs/LAs).',
		type: ApplicationCommandOptionType.String,
		required: true,
		choices: [
			{ name: 'Student', value: 'student' },
			{ name: 'Staff', value: 'staff' }
		]
	}, {
		name: 'roster',
		description: 'A .csv or .txt file with one udel.edu email per line.',
		type: ApplicationCommandOptionType.Attachment,
		required: true
	}]

	async run(interaction: ChatInputCommandInteraction): Promise<void> {
		await interaction.deferReply({ ephemeral: true });
		if (onboardRunning) {
			return this.sendError(interaction, 'Another onboarding run is already in progress. Please wait for it to finish, then try again.');
		}
		onboardRunning = true;
		try {
			await this.onboard(interaction);
		} catch (error) {
			interaction.client.emit('error', error);
			await interaction.editReply({
				content: null,
				embeds: [generateErrorEmbed(`Something went wrong during onboarding. ${MAINTAINERS} have been notified.`)]
			}).catch(() => undefined);
		} finally {
			onboardRunning = false;
		}
	}

	async onboard(interaction: ChatInputCommandInteraction): Promise<void> {
		const courseId = interaction.options.getString('course');
		const roleType = interaction.options.getString('roletype');
		const roster: Attachment = interaction.options.getAttachment('roster');
		const isStaff = roleType === 'staff';

		//	validate the attachment before downloading anything
		if (roster.size > MAX_FILE_SIZE) {
			return this.sendError(interaction, `That roster file is too large (over ${MAX_FILE_SIZE / 1000000} MB). Nothing was changed.`);
		}
		const rosterName = (roster.name || '').toLowerCase();
		if (!rosterName.endsWith('.csv') && !rosterName.endsWith('.txt')) {
			return this.sendError(interaction, 'The roster must be a .csv or .txt file with one udel.edu email per line. Nothing was changed.');
		}

		let text: string;
		try {
			//	size enforces the byte limit on the actual body; timeout guards against a stalled download
			const response = await fetch(roster.url, { size: MAX_FILE_SIZE, timeout: FETCH_TIMEOUT });
			if (!response.ok) {
				return this.sendError(interaction, 'I couldn\'t download the roster file from Discord. Please try again. Nothing was changed.');
			}
			text = await response.text();
		} catch (error) {
			return this.sendError(interaction, 'I couldn\'t download the roster file from Discord (too large or timed out). Nothing was changed.');
		}

		//	parse and validate every line before any writes happen
		const { emails, invalid, headerError } = this.parseRoster(text, courseId, roleType);
		if (headerError) {
			return this.sendError(interaction, headerError);
		}
		if (emails.length === 0) {
			return this.sendError(interaction, 'I couldn\'t find any valid udel.edu emails in that roster. Nothing was changed.');
		}
		if (emails.length > MAX_ROSTER_SIZE) {
			return this.sendError(interaction, `That roster has ${emails.length} emails; the limit per upload is ${MAX_ROSTER_SIZE}. Please split the file and run this command once per part.`);
		}

		//	make sure the course exists, creating it if necessary
		let course: Course = await interaction.client.mongo.collection(DB.COURSES).findOne({ name: courseId });
		let courseCreated = false;
		if (!course) {
			await interaction.editReply(`Course ${courseId} doesn't exist yet; creating its roles and channels...`);
			try {
				course = await createCourse(interaction, courseId);
			} catch (error) {
				interaction.client.emit('error', error);
				return this.sendError(interaction,
					`Something went wrong while creating course ${courseId}. Check the course's roles/channels (or run \`/addcourse\`), then re-run this command. No roster entries were written.`);
			}
			courseCreated = true;
		}

		//	onboard every email, emailing invites to new users
		const tally = await this.onboardAll(interaction, emails, isStaff, course, courseId);

		await this.report(interaction, tally, invalid, courseId, roleType, isStaff, courseCreated);
	}

	async onboardAll(interaction: ChatInputCommandInteraction, emails: Array<string>, isStaff: boolean, course: Course, courseId: string): Promise<OnboardTally> {
		const mailer = nodemailer.createTransport({
			host: 'mail.udel.edu',
			port: 25
		});
		const users = interaction.client.mongo.collection(DB.USERS);
		const tally: OnboardTally = { created: [], skipped: [], restaffed: [], verifiedStaff: [], emailFailed: [] };

		let processed = 0;
		for (const email of emails) {
			const { result, hash, entry } = await onboardUser(users, email, isStaff, course);
			switch (result) {
				case 'created':
					tally.created.push(email);
					try {
						await sendOnboardEmail(mailer, email, hash);
					} catch (error) {
						tally.emailFailed.push(email);
					}
					await sleep(EMAIL_DELAY);
					break;
				case 'restaffed':
					tally.restaffed.push(email);
					break;
				case 'verifiedStaff':
					tally.verifiedStaff.push(`${email} (Discord ID ${entry.discordId})`);
					break;
				case 'skipped':
					tally.skipped.push(email);
					break;
			}
			processed++;
			if (processed % PROGRESS_INTERVAL === 0 && processed < emails.length) {
				//	a failed progress update must never abort the rest of the roster
				await interaction.editReply(`Onboarding course ${courseId}: ${processed}/${emails.length} emails processed...`).catch(() => undefined);
			}
		}

		return tally;
	}

	parseRoster(text: string, courseId: string, roleType: string): RosterParse {
		const lines = text.split('\n').map(line => line.trim());

		let startIndex = 0;
		const headerMatch = lines.length > 0 ? lines[0].match(HEADER_REGEX) : null;
		if (headerMatch) {
			const headerType = headerMatch[1].toLowerCase();
			const headerCourse = headerMatch[2].toLowerCase();
			if (headerType !== roleType || headerCourse !== courseId.toLowerCase()) {
				return {
					emails: [],
					invalid: [],
					headerError: `The roster's header line (\`${lines[0]}\`) doesn't match the command options (**${roleType}**, course **${courseId}**). Nothing was changed.`
				};
			}
			startIndex = 1;
		}

		const seen = new Set<string>();
		const emails: Array<string> = [];
		const invalid: Array<string> = [];
		for (const line of lines.slice(startIndex)) {
			if (line === '') continue;
			const email = line.toLowerCase();
			if (!EMAIL_REGEX.test(email)) {
				invalid.push(line);
				continue;
			}
			if (seen.has(email)) continue;
			seen.add(email);
			emails.push(email);
		}

		return { emails, invalid };
	}

	async report(interaction: ChatInputCommandInteraction, tally: OnboardTally, invalid: Array<string>, courseId: string, roleType: string,
		isStaff: boolean, courseCreated: boolean): Promise<void> {
		const summary = [
			`**Course:** ${courseId}${courseCreated ? ' (newly created)' : ''}`,
			`**Role type:** ${roleType}`,
			`**New users created:** ${tally.created.length}`,
			`**Invites emailed:** ${tally.created.length - tally.emailFailed.length}`,
			`**Already onboarded (skipped):** ${tally.skipped.length}`
		];
		if (isStaff) {
			summary.push(`**Unverified users updated to staff:** ${tally.restaffed.length}`);
			summary.push(`**Verified users flagged as staff (add Discord roles manually):** ${tally.verifiedStaff.length}`);
		}
		if (invalid.length > 0) summary.push(`**Invalid lines ignored:** ${invalid.length}`);
		if (tally.emailFailed.length > 0) summary.push(`**Users created but email failed:** ${tally.emailFailed.length}`);

		await interaction.editReply({ content: summary.join('\n'), embeds: [] });

		const details: Array<string> = [];
		if (tally.verifiedStaff.length > 0) details.push(`Verified users flagged as staff (add Discord roles manually):\n${tally.verifiedStaff.join('\n')}`);
		if (tally.emailFailed.length > 0) details.push(`Users created but email failed (re-running won't re-email them; use the nudge script):\n${tally.emailFailed.join('\n')}`);
		if (invalid.length > 0) details.push(`Invalid lines ignored:\n${invalid.join('\n')}`);
		if (details.length > 0) {
			await interaction.followUp({
				content: 'Details that need your attention:',
				files: [await sendToFile(details.join('\n\n'), 'txt', 'onboard_details', true)],
				ephemeral: true
			});
		}
	}

	async sendError(interaction: ChatInputCommandInteraction, msg: string): Promise<void> {
		await interaction.editReply({ content: null, embeds: [generateErrorEmbed(msg)] });
	}

}
