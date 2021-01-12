import 'module-alias/register';
import fs from 'fs';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { MongoClient } from 'mongodb';
import { SageUser } from '@lib/types/SageUser';
import { BOT, EMAIL, GUILDS, MONGO } from '@root/config';

const MESSAGE = `<!DOCTYPE html>
<html>

<head>
	<title>Discord Verification</title>
</head>

<body>

	<h1 style="color:#00539F">Welcome!</h1>
	<p>You're getting this email because you're part of a class in the UD CIS Department that is using <span style="color:#738ADB">Discord</span> as its primary means of communication.</p>
	<p>To get set up and verified on the server, follow the instructions listed on <a href="google.com">this page.</a></p>
	<p>
		Click on <a href="https://discord.gg/$invCode">this link</a> for an invite to the gateway server.
	<p>Once you're on the server, right click Sage's name on the right side of the screen and select 'Message'. 
	<br>Send just your hash code and join the official server using the link that Sage sends back.
	</p>
	<p>Your hash code is: <span style="color:blueviolet">$hash</span></p>
	<p><br>We hope to see you on the server soon!<br>- The <span style="color:#738ADB">Discord</span> Admin Team</p>
	

</body>

</html>
`;

const mailer = nodemailer.createTransport({
	host: 'mail.udel.edu',
	port: 25
});

MongoClient.connect(MONGO, { useUnifiedTopology: true }).then(client => {
	const db = client.db(BOT.NAME).collection('users');
	fs.readFile('./resources/emails.csv', async (err, data) => {
		console.log('here');
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
			if (email === '') continue;

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
		process.exit();
	});
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
