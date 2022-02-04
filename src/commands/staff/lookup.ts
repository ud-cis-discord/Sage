import { DB, EMAIL } from '@root/config';
import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { SageUser } from '@lib/types/SageUser';
import { MessageEmbed, CommandInteraction, ApplicationCommandPermissionData, ApplicationCommandOptionData } from 'discord.js';
import nodemailer from 'nodemailer';
import { Command } from '@lib/types/Command';

export default class extends Command {

	permissions: ApplicationCommandPermissionData[] = [STAFF_PERMS, ADMIN_PERMS];
	description = 'Looks up information about a given user';
	runInDM = false;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'user',
			type: 'USER',
			description: 'The member to look up',
			required: true
		}
	];

	async run(interaction: CommandInteraction): Promise<void> {
		const user = interaction.options.getUser('user');
		const entry: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: user.id });

		if (!entry) {
			return interaction.reply({ content: `User ${user.tag} has not verified.`, ephemeral: true });
		}

		const embed = new MessageEmbed()
			.setColor('GREEN')
			.setAuthor(user.username, user.avatarURL())
			.setFooter(`ID: ${user.id}`)
			.addFields([
				{
					name: 'Email:',
					value: entry.email,
					inline: true
				},
				{
					name: 'Messages: ',
					value: entry.count.toString(),
					inline: true
				}
			]);

		if (!entry.pii) {
			const sender: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: user.id });
			this.sendEmail(sender.email, user.username, entry);
			return interaction.reply({ content: `That user has not opted in to have their information shared over Discord. 
	An email has been sent to you containing the requested data.`, ephemeral: true });
		}

		return interaction.reply({ embeds: [embed], ephemeral: true });
	}

	sendEmail(recipient: string, username: string, entry: SageUser): void {
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

}
