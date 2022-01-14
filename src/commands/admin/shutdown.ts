import { BOT } from '@root/config';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { ApplicationCommandPermissionData, CommandInteraction, Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	aliases = ['sd'];
	description = `Sets ${BOT.NAME}'s activity to 'Playing Shutting Down...' and ends the process.`;
	tempPermissions: ApplicationCommandPermissionData[] = [BOTMASTER_PERMS];

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const bot = interaction.client;
		bot.user.setActivity(`Shutting Down...`, { type: 'PLAYING' });
		interaction.reply(`Shutting down ${BOT.NAME}`)
			.then(() => {
				bot.destroy();
				process.exit(0);
			});
	}

	async run(msg: Message): Promise<void> {
		const bot = msg.client;
		bot.user.setActivity(`Shutting Down...`, { type: 'PLAYING' });
		msg.channel.send(`Shutting down ${BOT.NAME}`)
			.then(() => {
				bot.destroy();
				process.exit(0);
			});
	}

}
