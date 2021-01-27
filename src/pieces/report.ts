import { Client } from 'discord.js';
import { schedule } from 'node-cron';
import { Cursor } from 'mongodb';
import nodemailer from 'nodemailer';
import { SageUser } from '@lib/types/SageUser';
import { DB, EMAIL } from '@root/config';
import moment from 'moment';


async function register(bot: Client): Promise<void> {
	// 0 * * * SAT
	schedule('* * * * *', () => {
		handleCron(bot).catch(err => console.error(err));
	}, {
		timezone: 'America/New_York'
	});
}

async function handleCron(bot: Client): Promise<void> {
	const users: Array<SageUser> = await bot.mongo.collection(DB.USERS).find().toArray();
	let report = 'Email,Count\n';
	users.forEach(user => {
		report += `${user.email},${user.count}\n`;
	});

	const mailer = nodemailer.createTransport({
		host: 'mail.udel.edu',
		port: 25
	});

	mailer.sendMail({
		from: EMAIL.SENDER,
		replyTo: EMAIL.REPLY_TO,
		bcc: EMAIL.REPORT_ADDRESSES,
		subject: 'Discord weekly Report',
		html: `<!doctype html>
<html>
	<p> Here is your weekly Discord participation report. </p>
	<p> The <span style="color:#738ADB">Discord</span> Admin Team </p>
</html>`,
		attachments: [{
			filename: `report${moment().format('M-D-YY_HH-mm-ss')}.csv`,
			content: report
		}]
	});

	bot.mongo.collection(DB.USERS).updateMany({}, { $set: { count: 0 } });
}

export default register;
