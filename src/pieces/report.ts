import { Client } from 'discord.js';
import { schedule } from 'node-cron';
import nodemailer from 'nodemailer';
import moment from 'moment';
import { SageUser } from '@lib/types/SageUser';
import { DB, EMAIL } from '@root/config';
import { Course } from '../lib/types/Course';
import { Attachment } from 'nodemailer/lib/mailer';


async function register(bot: Client): Promise<void> {
	// 0 0 * * SUN :: 0 minutes, 0 hours, any day of month, any month, on Sundays (AKA midnight between Sat & Sun)
	schedule('* * * * *', () => {
		handleCron(bot)
			.catch(async error => bot.emit('error', error));
	});
}

async function handleCron(bot: Client): Promise<void> {
	const users: Array<SageUser> = await bot.mongo.collection(DB.USERS).find().toArray();
	const courses: Array<Course> = await bot.mongo.collection(DB.COURSES).find().toArray();

	const mailer = nodemailer.createTransport({
		host: 'mail.udel.edu',
		port: 25
	});

	const reportProfs: Array<SageUser> = users.filter(user => EMAIL.REPORT_ADDRESSES.includes(user.email));
	reportProfs.forEach(prof => {
		const reports: Attachment[] = [];
		const coursesTaught = courses.filter(course => prof.roles.includes(course.roles.staff));
		coursesTaught.forEach(course => {
			const courseUsers = users.filter(user => user.courses.includes(course.name));
			reports.push({
				filename: `CISC${course.name}_${moment().format('M-D-YY_HH-mm-ss')}.csv`,
				content: `Email,Count\n${courseUsers.map(user => `${user.email},${user.count}`).join('\n')}`
			});
		});
		reports.forEach(report => console.log(`\n${report.filename}\n${report.content}`));

		mailer.sendMail({
			from: EMAIL.SENDER,
			replyTo: EMAIL.REPLY_TO,
			bcc: prof.email,
			subject: 'Discord weekly Report',
			html: `<!doctype html>
	<html>
		<p> Here is your weekly Discord participation report. </p>
		<p>- The <span style="color:#738ADB">Discord</span> Admin Team </p>
	</html>`,
			attachments: reports
		});
	});

	// bot.mongo.collection(DB.USERS).updateMany({}, { $set: { count: 0 } });
}

export default register;
