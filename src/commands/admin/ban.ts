import { ApplicationCommandOptionData, ChatInputCommandInteraction, EmbedBuilder, ApplicationCommandOptionType, CommandInteractionOptionResolver, InteractionResponse, ApplicationCommandPermissions } from 'discord.js';
import { Command } from '@lib/types/Command';
import { generateErrorEmbed } from '@root/src/lib/utils/generalUtils';
import { BOTMASTER_PERMS } from '@lib/permissions';

export default class extends Command { // Made by matt nadar

	description = 'This command will ban a member from the server.';
	permissions: ApplicationCommandPermissions[] = BOTMASTER_PERMS;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'user', // get the user you want to ban
			description: 'the user you want to ban from the server',
			type: ApplicationCommandOptionType.Mentionable,
			required: true
		},
		{
			name: 'reason', // get the reason for banning. Not required
			description: 'the reason this user is being banned',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	]


	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const targetUserID = interaction.options.get('user')?.user?.id;
		const reason = interaction.options.get('reason')?.value?.toString() || 'No reason provided';

		await interaction.deferReply();

		const targetUser = await interaction.guild.members.fetch(targetUserID);

		if (!targetUser) { // checks if the user exists in the server.
			await interaction.editReply('That user does not exist in the server');
			return;
		}

		if (targetUser.id === interaction.guild.ownerId) { // makes sure we don't ban the owner lol.
			await interaction.editReply('You cannot ban the owner of the server');
			return;
		}

		try { // ban the target user
			await targetUser.ban({ reason });
			const responseEmbed = new EmbedBuilder()
				.setColor('Red')
				.setTitle('Ban Info')
				.setFooter({ text: `User ${targetUser.displayName} was banned.\nReason : ${reason}.` });
			await interaction.editReply({ embeds: [responseEmbed] });
		} catch (error) {
			console.log('There was an error while banning: ${error}');
		}
	}

}
