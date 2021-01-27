import { Client, TextChannel } from 'discord.js';
import { schedule } from 'node-cron';
import nodemailer from 'nodemailer';
import moment from 'moment';
import { generateLogEmbed } from '@lib/utils';
import { SageUser } from '@lib/types/SageUser';
import { CHANNELS, DB, EMAIL } from '@root/config';


async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(CHANNELS.ERROR_LOG) as TextChannel;
	// 0 * * * SAT
	schedule('0 * * * SAT', () => {
		handleCron(bot)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
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
	<p>- The <span style="color:#738ADB">Discord</span> Admin Team </p>
</html>`,
		attachments: [{
			filename: `report${moment().format('M-D-YY_HH-mm-ss')}.csv`,
			content: report
		}]
	});

	bot.mongo.collection(DB.USERS).updateMany({}, { $set: { count: 0 } });
}

export default register;
