import { BOT } from '@root/config';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { ApplicationCommandPermissionData, CommandInteraction, Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Sets ${BOT.NAME}'s activity to 'Playing Restart...' and ends the process.`;
	tempPermissions: ApplicationCommandPermissionData[] = BOTMASTER_PERMS;

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const bot = interaction.client;
		bot.user.setActivity(`Restarting...`, { type: 'PLAYING' });
		interaction.reply(`Restarting ${BOT.NAME}`)
			.then(() => {
				bot.destroy();
				process.exit(0);
			});
	}

	async run(msg: Message): Promise<void> { return; }

}
