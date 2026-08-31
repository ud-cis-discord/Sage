import { ApplicationCommandPermissions, ChatInputCommandInteraction, InteractionResponse } from 'discord.js';
import { ADMIN_PERMS } from '@lib/permissions';
import { MAINTAINERS } from '@root/config';
import { Command } from '@lib/types/Command';
import { updateDropdowns } from '@root/src/lib/utils/generalUtils';

export default class extends Command {

	description = 'Rebuilds the course and self-assignable role dropdowns from the current database state.';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		// reply first: refreshing the dropdowns does several fetches and can outlast the 3-second interaction window
		await interaction.reply('<a:loading:755121200929439745> Refreshing the role dropdowns...');
		try {
			await updateDropdowns(interaction);
		} catch (error) {
			interaction.client.emit('error', error);
			await interaction.editReply(`The dropdowns couldn't be refreshed. ${MAINTAINERS} have been notified.`);
			return;
		}
		await interaction.editReply('Dropdown refresh finished. If a dropdown had a problem, it was reported above.');
	}

}
