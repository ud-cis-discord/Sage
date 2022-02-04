import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { BOT } from '@root/config';
import { MessageEmbed, ApplicationCommandPermissionData, ApplicationCommandOptionData, CommandInteraction } from 'discord.js';

export default class extends Command {

	permissions: ApplicationCommandPermissionData[] = [STAFF_PERMS, ADMIN_PERMS];
	description = `Have ${BOT.NAME} google something for someone`;
	options: ApplicationCommandOptionData[] = [
		{
			name: 'query',
			type: 'STRING',
			description: `What you'd like ${BOT.NAME} to Google for someone!`,
			required: true
		}
	];

	run(interaction: CommandInteraction): Promise<void> {
		const query = interaction.options.getString('query');
		const formatted = query.replace(new RegExp(' ', 'g'), '+').replace('%', '%25');
		const link = `https://letmegooglethat.com/?q=${formatted}`;
		const embed = new MessageEmbed({
			description: `[Let me Google that for you!](${link})`,
			color: 'LUMINOUS_VIVID_PINK'
		});
		return interaction.reply({ embeds: [embed] });
	}

}
