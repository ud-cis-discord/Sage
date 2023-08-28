import { DB, EMAIL } from '@root/config';
import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { SageUser } from '@lib/types/SageUser';
import { EmbedBuilder, ChatInputCommandInteraction, ApplicationCommandPermissions, ApplicationCommandOptionData, ApplicationCommandOptionType,
	InteractionResponse } from 'discord.js';
import nodemailer from 'nodemailer';
import { Command } from '@lib/types/Command';

export default class extends Command {

	permissions: ApplicationCommandPermissions[] = [STAFF_PERMS, ADMIN_PERMS];
	description = 'Looks up information about a given user';
	runInDM = false;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'user',
			type: ApplicationCommandOptionType.User,
			description: 'The member to look up',
			required: true
		}
	];

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const user = interaction.options.getUser('user');
		const entry: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: user.id });
		const member = await interaction.guild.members.fetch(user.id);

		if (!entry) {
			return interaction.reply({ content: `User ${user.tag} has not verified.`, ephemeral: true });
		}

		const embed = new EmbedBuilder()
			.setTitle(`Looking Up:	${member.displayName}`)
			.setThumbnail(user.avatarURL())
			.setColor('Green')
			.setFooter({ text: `Member ID: ${user.id}` })
			.setTimestamp()
			.addFields([
				{ name: 'Display Name', value: `<@${member.id}>`, inline: true },
				{ name: 'Username', value: `${user.tag}`, inline: false },
				{ name: 'UD Email:', value: entry.email, inline: false },
				{ name: 'Message count: ', value: `This week: ${entry.count.toString()}`, inline: false }
			]);

		if (!entry.pii) {
			const sender: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: interaction.user.id });
			this.sendEmail(sender.email, member.displayName, user.tag, entry);
			return interaction.reply(
				{ content: `\`${user.tag}\` has not opted to have their information shared over Discord.\nInstead, an email has been sent to you containing the requested data.`,
					ephemeral: true });
		}

		return interaction.reply({ embeds: [embed], ephemeral: true });
	}

	sendEmail(recipient: string, displayName: string, username: string, entry: SageUser): void {
		const mailer = nodemailer.createTransport({
			host: 'mail.udel.edu',
			port: 25
		});

		mailer.sendMail({
			from: EMAIL.SENDER,
			replyTo: EMAIL.REPLY_TO,
			to: recipient,
			subject: `UD CIS Discord:requested student information`,
			html: `<!DOCTYPE html>
			<html>
				<body>
					<h4>Your requested user information:</h4>
					<table style="text-align: left; border: 1px solid black; border-collapse: collapse;">
						<tr>
							<th style="padding-right: 50px; border: 1px solid black;">Display Name</th>
							<th style="padding-right: 50px; border: 1px solid black;">Username</th>
							<th style="padding-right: 50px; border: 1px solid black;">University Email</th>
							<th style="padding-right: 50px; border: 1px solid black;">Message Count</th>
							<th style="padding-right: 50px; border: 1px solid black;">Member ID</th></tr>
						<tr>
							<td style="border: 1px solid black;">${displayName}</td>
							<td style="border: 1px solid black;">${username}</td>
							<td style="border: 1px solid black;">${entry.email}</td>
							<td style="border: 1px solid black;">This week: ${entry.count}</td>
							<td style="border: 1px solid black;">${entry.discordId}</td></tr>
					</table>
					<p><br>Thank you for using the UD CIS Discord Server and Sage!</p>
				</body>
			</html>`
		});
	}

}
