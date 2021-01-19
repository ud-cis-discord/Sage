import { DB, EMAIL, MAINTAINERS } from '@root/config';
import { userParser } from '@lib/arguments';
import { staffPerms } from '@lib/permissions';
import { SageUser } from '@lib/types/SageUser';
import { Message, GuildMember, MessageEmbed } from 'discord.js';
import nodemailer from 'nodemailer';

export const description = 'Looks up information about a given user';
export const usage = '<user>';
export const runInDM = false;

export function permissions(msg: Message): boolean {
	return staffPerms(msg);
}

export async function run(msg: Message, member: GuildMember): Promise<void> {
	const entry: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: member.user.id });

	if (!entry) {
		throw `User ${member.user.username} (${member.user.id}) not in database. Contact ${MAINTAINERS} 
		if you think this is an error.`;
	}

	const embed = new MessageEmbed()
		.setColor('GREEN')
		.setAuthor(member.user.username, member.user.avatarURL())
		.setFooter(`ID: ${member.user.id}`)
		.addFields([
			{
				name: 'Email:',
				value: entry.email,
				inline: true
			},
			{
				name: 'Messages: ',
				value: entry.count,
				inline: true
			}
		]);

	if (!entry.pii) {
		const sender: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });
		msg.channel.send(`That user has not opted in to have their information shared over Discord. 
An email has been sent to you containing the requested data.`);
		sendEmail(sender.email, member.user.username, entry);
		return;
	}

	msg.author.send(embed).then(() => msg.channel.send('I\'ve sent the requested info to your DMs'))
		.catch(() => msg.channel.send('I couldn\'t send you a DM. Please enable DMs and try again'));
	return;
}

function sendEmail(recipient: string, username: string, entry: SageUser): void {
	const mailer = nodemailer.createTransport({
		host: 'mail.udel.edu',
		port: 25
	});

	mailer.sendMail({
		from: EMAIL.SENDER,
		replyTo: EMAIL.REPLY_TO,
		to: recipient,
		subject: `Requested student information`,
		html: `<!DOCTYPE html>
<html>

<head>
	<title>User Information</title>
</head>

<body>

	<h1>Your requested user information: </h1>
	<p>User: ${username}</p>
	<p>Email: ${entry.email}</p>
	<p>Message Count: ${entry.count}</p>
	<p>ID: ${entry.discordId}</p>
	<p><br>Thanks for using Sage!</p>

</body>

</html>`
	});
}

export async function argParser(msg: Message, input: string): Promise<GuildMember> {
	return await userParser(msg, input);
}
