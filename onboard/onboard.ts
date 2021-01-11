import 'module-alias/register';
import fs from 'fs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { MongoClient } from 'mongodb';
import { TextChannel, Client } from 'discord.js';
import { SageUser } from '@lib/types/SageUser';
import { BOT, EMAIL, GUILDS, MONGO } from '@root/config';

const MESSAGE = `Hello,

You are part of a class which is using the UD CIS Discord Server in S21. 
Hash: $hash
Invite: https://discord.gg/$invCode
`;

const mailer = nodemailer.createTransport({
	host: 'mail.udel.edu',
	port: 25
});

MongoClient.connect(MONGO, { useUnifiedTopology: true }).then(client => {
	const db = client.db(BOT.NAME).collection('users');
	fs.readFile('./resources/emails.csv', async (err, data) => {
		if (err) {
			console.error(err);
			return;
		}

		const emails = data.toString().split('\n').map(email => email.trim());
		let isStaff: boolean;

		if (emails[0] === 'STAFF') {
			isStaff = true;
		} else if (emails[0] === 'STUDENT') {
			isStaff = false;
		} else {
			console.error('First value must be STAFF or STUDENT');
			process.exit(1);
		}

		emails.shift();
		for (const email of emails) {
			const hash = crypto.createHash('sha256').update(email).digest('base64').toString();
			console.log(email, ':', isStaff, ':', hash);

			const entry: SageUser = await db.findOne({ email: email, hash: hash });

			const newUser: SageUser = {
				email: email,
				hash: hash,
				isStaff: isStaff,
				discordId: '',
				count: 0,
				isVerified: false,
				pii: false,
				roles: []
			};

			if (entry) {			// User already on-boarded
				if (isStaff) {		// Make staff is not already
					db.updateOne(entry, { $set: { ...newUser } });
				}
				continue;
			}

			db.insertOne(newUser);

			sendEmail(email, hash);
		}
	});
	process.exit();
});

async function sendEmail(email: string, hash: string): Promise<void> {
	mailer.sendMail({
		from: EMAIL.SENDER,
		replyTo: EMAIL.REPLY_TO,
		to: email,
		subject: 'Welcome to the UD CIS Discord!',
		html: MESSAGE.replace('$hash', hash).replace('$invCode', GUILDS.GATEWAY_INVITE)
	});
}
