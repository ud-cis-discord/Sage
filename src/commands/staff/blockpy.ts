import { DB, EMAIL } from '@root/config';
import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { SageUser } from '@lib/types/SageUser';
import { ChatInputCommandInteraction, ApplicationCommandPermissions, ApplicationCommandOptionData, ApplicationCommandOptionType, InteractionResponse } from 'discord.js';
import nodemailer from 'nodemailer';
import { Command } from '@lib/types/Command';

export default class extends Command {

	permissions: ApplicationCommandPermissions[] = [STAFF_PERMS, ADMIN_PERMS];
	description = 'Emails you a link to the students blockpy submissions';
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

		const sender: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: interaction.user.id });
		this.sendEmail(sender.email, member.displayName, user.tag, entry);
		return interaction.reply(
			{ content: `An email has been sent to you containing the requested data about \`${user.tag}\`.`,
				ephemeral: true });
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
			subject: `UD CIS Discord:requested student blockpy link`,
			html: `<!DOCTYPE html>
			<html>
				<body>
					<h4>Your requested user information:</h4>
          <a href="https://blockpy.cis.udel.edu/blockpy/recent_submissions?email=${entry.email}"
		  >BlockPy submissions for this student (${displayName}, also known as ${username}). Their email is ${entry.email}</a>
					<p><br>Thank you for using the UD CIS Discord Server and Sage!</p>
				</body>
			</html>`
		});
	}

}
