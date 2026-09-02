import 'module-alias/register';
import fs from 'fs';
import nodemailer from 'nodemailer';
import { MongoClient } from 'mongodb';
import { Course } from '@lib/types/Course';
import { BOT, DB } from '@root/config';
import { onboardUser, sendOnboardEmail, sleep } from '@lib/utils/onboardUtils';

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
	}

	let isStaff: boolean;

	if (emails[0].toLowerCase() === 'staff') {
		isStaff = true;
	} else if (emails[0].toLowerCase() === 'student') {
		isStaff = false;
	} else {
		console.error('First value must be STAFF or STUDENT');
		process.exit();
	}

	emails.shift();
	console.log(`${'email'.padEnd(18)} | ${'staff'.padEnd(5)} | hash
-------------------------------------------------------------------------`);
	for (const email of emails) {
		if (email === '') continue;
		if (!email.endsWith('@udel.edu')) {
			console.error(`${email} is not a valid udel email.`);
			continue;
		}

		const { result, hash, entry } = await onboardUser(db, email, isStaff, course);

		if (result === 'verifiedStaff') {
			console.log(`${email} was already in verified. Add staff roles manually. Discord ID ${entry.discordId}`);
			continue;
		}
		if (result !== 'created') continue;

		console.log(`${email.padEnd(18)} | ${isStaff.toString().padEnd(5)} | ${hash}`);

		sendOnboardEmail(mailer, email, hash);
		await sleep(1100);
	}

	client.close();
}

main();
