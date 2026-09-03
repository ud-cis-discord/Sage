import 'module-alias/register';
import { MongoClient, ObjectID } from 'mongodb';
import nodemailer from 'nodemailer';
import { SageUser } from '@lib/types/SageUser';
import { DB, BOT, EMAIL, GUILDS } from '@root/config';

const MESSAGE = `<!DOCTYPE html>
<html>

<head>
	<title>Discord Verification</title>
</head>

<body>

	<h2 style="color:#00539F">UD CIS Discord Verification</h2>
	<p>You're getting this email because you're part of a class in the UD CIS Department that is using <span style="color:#738ADB">Discord</span> 
	as its primary means of communication, and you haven't yet verified. Our records show that you recieved an email about the verification process on $timestamp.</p>
	<p>Please follow the steps below to verify so you can get started using the UD CIS Discord.</p>
	<p><strong>If you don't have a <span style="color:#738ADB">Discord</span> account already, click <a href="https://discord.com/register">here</a> to sign up for one.</strong></p>
	<p>
		Click <a href="https://discord.gg/$invCode">here</a> to join the server and get yourself verified.
	<p>Once you're on the server, follow the instructions given to you in the channel called "getting-verified": press the Verify button and paste your hash code (given below) into the box.
	</p>
	<p>Your hash code is: <span style="color:blueviolet">$hash</span></p>
	<p>Copy and paste the code exactly as shown &mdash; it is case-sensitive. It is the same code you were sent originally; it does not change.</p>
	<p><br>We hope to see you on the server soon!<br>- The <span style="color:#738ADB">Discord</span> Admin Team</p>
	

</body>

</html>
`;

const mailer = nodemailer.createTransport({
	host: 'mail.udel.edu',
	port: 25
});

async function main() {
	const client = await MongoClient.connect(DB.CONNECTION, { useUnifiedTopology: true });
	const db = client.db(BOT.NAME).collection(DB.USERS);
	const users: Array<DatabaseUser> = await db.find().toArray();

	const args = process.argv.slice(2);
	const failed: Array<string> = [];

	if (args.length > 0) {
		for (const rawEmail of args) {
			const email = rawEmail.trim().toLowerCase();
			let user: DatabaseUser;
			if (!(user = users.find(usr => usr.email.toLowerCase() === email))) { // user not in db
				console.log(`${email} was not previously in the database. Run the onboard script with this email to onboard.`);
				continue;
			}

			if (user.isVerified) { // user already verified
				console.log(`${email} is already verified.`);
				continue;
			}

			await nudge(user, failed);
		}
	} else {
		for (const user of users) {
			if (user.isVerified) continue;

			await nudge(user, failed);
		}
	}

	if (failed.length > 0) {
		console.error(`Email failed for ${failed.length} user(s):\n${failed.join('\n')}`);
	}
	await client.close();
}

// one bad address must not abort the rest of the run
async function nudge(user: DatabaseUser, failed: Array<string>): Promise<void> {
	console.log(`Emailing: ${user.email}`);
	try {
		await sendEmail(user);
	} catch (error) {
		failed.push(user.email);
		console.error(`Failed to email ${user.email}: ${error.message ?? error}`);
	}
	await sleep(1100);
}

function sendEmail(user: DatabaseUser) {
	return mailer.sendMail({
		from: EMAIL.SENDER,
		replyTo: EMAIL.REPLY_TO,
		to: user.email,
		subject: 'Dont forget to verify on the UD CIS Discord.',
		html: MESSAGE
			.replace('$hash', user.hash)
			.replace('$invCode', GUILDS.GATEWAY_INVITE)
			.replace('$timestamp', user._id.getTimestamp().toDateString())
	});
}

function sleep(ms: number) {
	return new Promise((resolve) => {
		setTimeout(resolve, ms);
	});
}

interface DatabaseUser extends SageUser {
	_id: ObjectID
}

main();
