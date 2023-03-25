import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { BOT } from '@root/config';
import { EmbedBuilder, ApplicationCommandPermissions, ApplicationCommandOptionData, CommandInteraction } from 'discord.js';

export default class extends Command {

	permissions: ApplicationCommandPermissions[] = [STAFF_PERMS, ADMIN_PERMS];
	description = `Have ${BOT.NAME} google something for someone`;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'query',
			type: ApplicationCommandOptionType.String,
			description: `What you'd like ${BOT.NAME} to Google for someone!`,
			required: true
		}
	];

	run(interaction: CommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const query = (interaction.options as CommandInteractionOptionResolver).getString('query');
		const formatted = query.replace(new RegExp(' ', 'g'), '+').replace('%', '%25');
		const link = `https://letmegooglethat.com/?q=${formatted}`;
		const embed = new EmbedBuilder({
			description: `[Let me Google that for you!](${link})`,
			color: 'LUMINOUS_VIVID_PINK'
		});
		return interaction.reply({ embeds: [embed] });
	}

}
