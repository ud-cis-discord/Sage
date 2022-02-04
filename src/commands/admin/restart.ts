import { BOT } from '@root/config';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { ApplicationCommandPermissionData, CommandInteraction } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Sets ${BOT.NAME}'s activity to 'Playing Restart...' and ends the process.`;
	permissions: ApplicationCommandPermissionData[] = BOTMASTER_PERMS;

	async run(interaction: CommandInteraction): Promise<void> {
		const bot = interaction.client;
		bot.user.setActivity(`Restarting...`, { type: 'PLAYING' });
		interaction.reply(`Restarting ${BOT.NAME}`)
			.then(() => {
				bot.destroy();
				process.exit(0);
			});
	}

}
