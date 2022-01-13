import { DB, EMAIL } from '@root/config';
import { userParser } from '@lib/arguments';
import { ADMIN_PERMS, staffPerms, STAFF_PERMS } from '@lib/permissions';
import { SageUser } from '@lib/types/SageUser';
import { Message, GuildMember, MessageEmbed, CommandInteraction, ApplicationCommandPermissionData, ApplicationCommandOptionData } from 'discord.js';
import nodemailer from 'nodemailer';
import { Command } from '@lib/types/Command';

export default class extends Command {

	tempPermissions: ApplicationCommandPermissionData[] = [STAFF_PERMS, ADMIN_PERMS];


	description = 'Looks up information about a given user';
	usage = '<user>';
	runInDM = false;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'user',
			type: 'USER',
			description: 'The member to look up',
			required: true
		}
	];

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const user = interaction.options.getUser('user');
		const entry: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: user.id });

		if (!entry) {
			interaction.reply({ content: `User ${user.tag} has not verified.`, ephemeral: true });
			return;
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
			interaction.reply({ content: `That user has not opted in to have their information shared over Discord. 
	An email has been sent to you containing the requested data.`, ephemeral: true });
			this.sendEmail(sender.email, user.username, entry);
			return;
		}

		interaction.user.send({ embeds: [embed] }).then(() => interaction.reply({
			content: 'I\'ve sent the requested info to your DMs',
			ephemeral: true
		})).catch(() => interaction.reply({
			content: 'I couldn\'t send you a DM. Please enable DMs and try again',
			ephemeral: true
		}));
		return;
	}

	permissions(msg: Message): boolean {
		return staffPerms(msg);
	}

	async run(msg: Message, [member]: [GuildMember]): Promise<void> {
		const entry: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: member.user.id });

		if (!entry) {
			msg.channel.send(`User ${member.user.tag} has not verified.`);
			return;
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
					value: entry.count.toString(),
					inline: true
				}
			]);

		if (!entry.pii) {
			const sender: SageUser = await msg.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });
			msg.channel.send(`That user has not opted in to have their information shared over Discord. 
	An email has been sent to you containing the requested data.`);
			this.sendEmail(sender.email, member.user.username, entry);
			return;
		}

		msg.author.send({ embeds: [embed] }).then(() => msg.channel.send('I\'ve sent the requested info to your DMs'))
			.catch(() => msg.channel.send('I couldn\'t send you a DM. Please enable DMs and try again'));
		return;
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

	async argParser(msg: Message, input: string): Promise<Array<GuildMember>> {
		return [await userParser(msg, input)];
	}

}
