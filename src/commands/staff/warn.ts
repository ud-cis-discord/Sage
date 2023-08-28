import { ApplicationCommandOptionData, ApplicationCommandPermissions, ChatInputCommandInteraction, Message, EmbedBuilder, TextChannel, ApplicationCommandOptionType } from 'discord.js';
import nodemailer from 'nodemailer';
import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { Course } from '@lib/types/Course';
import { SageUser } from '@lib/types/SageUser';
import { DB, EMAIL } from '@root/config';
import { Command } from '@lib/types/Command';
import { getMsgIdFromLink } from '@root/src/lib/utils/generalUtils';

export default class extends Command {

	runInDM = false;
	description = 'Warns a user for breaking the rules and deletes the offending message.';
	extendedHelp = 'This command must be used when replying to a message.';
	options: ApplicationCommandOptionData[] = [
		{
			name: 'msglink',
			description: 'Link to the offending message',
			type: ApplicationCommandOptionType.String,
			required: true
		},
		{
			name: 'reason',
			description: 'Reason for warning the user',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	]
	permissions: ApplicationCommandPermissions[] = [STAFF_PERMS, ADMIN_PERMS];

	async run(interaction: ChatInputCommandInteraction): Promise<Message> {
		const target = await interaction.channel.messages.fetch(getMsgIdFromLink(interaction.options.getString('msglink')));
		const reason = interaction.options.getString('reason') || 'Breaking server rules';
		if ('parentId' in interaction.channel) {
			const course: Course = await interaction.client.mongo.collection(DB.COURSES)
				.findOne({ 'channels.category': interaction.channel.parentId });

			if (course) {
				const staffChannel = interaction.guild.channels.cache.get(course.channels.staff) as TextChannel;
				const embed = new EmbedBuilder()
					.setTitle(`${interaction.user.tag} Warned ${target.author.tag}`)
					.setFooter({ text: `${target.author.tag}'s ID: ${target.author.id} | ${interaction.user.tag}'s ID: ${interaction.user.id}` })
					.addFields([{
						name: 'Reason',
						value: reason
					}, {
						name: 'Message content',
						value: target.content || '*This message had no text content*'
					}]);
				staffChannel.send({ embeds: [embed] });
			}
		}

		target.author.send(`Your message was deleted in ${target.channel} by ${interaction.user.tag}. Below is the given reason:\n${reason}`)
			.catch(async () => {
				const targetUser: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: target.author.id });
				if (!targetUser) throw `${target.author.tag} (${target.author.id}) is not in the database`;
				this.sendEmail(targetUser.email, interaction.user.tag, reason);
			});

		interaction.reply({ content: `${target.author.username} has been warned.`, ephemeral: true });
		return target.delete();
	}

	sendEmail(recipient: string, mod: string, reason: string): void {
		const mailer = nodemailer.createTransport({
			host: 'mail.udel.edu',
			port: 25
		});

		mailer.sendMail({
			from: EMAIL.SENDER,
			replyTo: EMAIL.REPLY_TO,
			to: recipient,
			subject: `UD CIS Discord Warning`,
			html: `<!DOCTYPE html>
	<html>
	<body>

		<h3>You were issued a warning on the UD CIS Discord server by ${mod}</h3>
		<p>Reason for warning:</p>
		<p>${reason}</p>

	</body>

	</html>`
		});
	}

}
