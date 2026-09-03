import 'module-alias/register';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { MongoClient } from 'mongodb';
import { Course } from '@lib/types/Course';
import { BOT, DB } from '@root/config';
import { needsInvite, onboardUser, sendOnboardEmail, sleep } from '@lib/utils/onboardUtils';

const mailer = nodemailer.createTransport({
	host: 'mail.udel.edu',
	port: 25
});

async function main() {
	const client = await MongoClient.connect(DB.CONNECTION, { useUnifiedTopology: true });
	const db = client.db(BOT.NAME).collection(DB.USERS);
	const args = process.argv.slice(2);
	let emails: Array<string>;
	let course: Course;

	if (args.length > 0) {
		if (args[0].toLowerCase() === 'staff') {
			emails = args;
		} else {
			emails = ['STUDENT', ...args];
		}
	} else {
		const data = fs.readFileSync('./resources/emails.csv');
		emails = data.toString().split('\n').map(email => email.trim());
		let courseId: string;
		[emails[0], courseId] = emails[0].split(',').map(str => str.trim());
		course = await client.db(BOT.NAME).collection(DB.COURSES).findOne({ name: courseId });
		if (!course) {
			console.error(`Course ${courseId} does not exist. Run /addcourse first. Nothing was changed.`);
			await client.close();
			process.exit(1);
		}
	}

	let isStaff: boolean;

	if (emails[0].toLowerCase() === 'staff') {
		isStaff = true;
	} else if (emails[0].toLowerCase() === 'student') {
		isStaff = false;
	} else {
		console.error('First value must be STAFF or STUDENT');
		await client.close();
		process.exit(1);
	}

	emails.shift();
	const tally = { created: 0, resent: 0, verified: 0, invalid: 0, emailFailed: [] as Array<string> };
	console.log(`${'email'.padEnd(18)} | ${'staff'.padEnd(5)} | hash
-------------------------------------------------------------------------`);
	for (const rawEmail of emails) {
		if (rawEmail === '') continue;
		// lowercase so this path mints the same hash as /onboardcourse for the same address
		const email = rawEmail.toLowerCase();
		if (!email.endsWith('@udel.edu')) {
			console.error(`${rawEmail} is not a valid udel email.`);
			tally.invalid++;
			continue;
		}

		const { result, hash, entry } = await onboardUser(db, email, isStaff, course);

		if (result === 'verifiedStaff') {
			console.log(`${email} was already in verified. Add staff roles manually. Discord ID ${entry.discordId}`);
			continue;
		}
		if (!needsInvite(result, entry)) {
			console.log(`${email} is already verified, skipping.`);
			tally.verified++;
			continue;
		}

		const resent = result !== 'created';
		if (resent) tally.resent++; else tally.created++;
		console.log(`${email.padEnd(18)} | ${isStaff.toString().padEnd(5)} | ${hash}${resent ? ' (re-sent)' : ''}`);

		try {
			await sendOnboardEmail(mailer, email, hash);
		} catch (error) {
			tally.emailFailed.push(email);
			console.error(`Failed to email ${email}: ${error.message ?? error}`);
		}
		await sleep(1100);
	}

	console.log(`
Done. New users created: ${tally.created} | Invites re-sent to unverified users: ${tally.resent} | Already verified (skipped): ${tally.verified} | Invalid lines: ${tally.invalid}`);
	if (tally.emailFailed.length > 0) {
		console.error(`Email failed for ${tally.emailFailed.length} user(s) (re-run this script to retry them; the hash does not change):\n${tally.emailFailed.join('\n')}`);
	}

	await client.close();
}

main();
