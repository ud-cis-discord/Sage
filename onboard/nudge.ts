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
		Click <a href="https://discord.gg/$invCode">here</a> for the verification site.
	<p>Once you're on the guild, right click Sage's name on the right side of the screen and select 'Message'. 
	<br>Send just your hash code and join the official guild using the link that Sage sends back.
	</p>
	<p>Your hash code is: <span style="color:blueviolet">$hash</span></p>
	<p><br>We hope to see you on the guild soon!<br>- The <span style="color:#738ADB">Discord</span> Admin Team</p>
	

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

	for (const user of users) {
		if (user.isVerified) continue;

		console.log(`Emailing: ${user.email}`);
		await sendEmail(user);
		await sleep(1100);
	}

	client.close();
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
