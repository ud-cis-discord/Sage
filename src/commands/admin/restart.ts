import { BOT } from '@root/config';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { ActivityType, ApplicationCommandPermissions, CommandInteraction } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Sets ${BOT.NAME}'s activity to 'Playing Restart...' and ends the process.`;
	permissions: ApplicationCommandPermissions[] = BOTMASTER_PERMS;

	async run(interaction: CommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const bot = interaction.client;
		bot.user.setActivity(`Restarting...`, { type: ActivityType.Playing });
		interaction.reply(`Restarting ${BOT.NAME}`)
			.then(() => {
				bot.destroy();
				process.exit(0);
			});
	}

}
