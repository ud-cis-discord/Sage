import { BOT } from '@root/config';
import { BOTMASTER_PERMS } from '@root/src/lib/permissions';
import { Command } from '@root/src/lib/types/Command';
import { readdirRecursive } from '@root/src/lib/utils/generalUtils';
import { ApplicationCommandData, CommandInteraction } from 'discord.js';

export default class extends Command {

	description = `Re-loads all of ${BOT.NAME}'s commands. WARNING: This takes forever`;
	permissions = BOTMASTER_PERMS;

	async run(interaction: CommandInteraction): Promise<void> {
		const commandFiles = readdirRecursive(`${__dirname}/..`).filter(file => file.endsWith('.js'));
		interaction.deferReply();

		const commands: ApplicationCommandData[] = [];
		for (const file of commandFiles) {
			const commandModule = await import(file);

			const dirs = file.split('/');
			const name = dirs[dirs.length - 1].split('.')[0];

			// semi type-guard, typeof returns function for classes
			if (!(typeof commandModule.default === 'function')) {
				console.log(`Invalid command ${name}`);
				continue;
			}

			// eslint-disable-next-line new-cap
			const command: Command = new commandModule.default;

			command.name = name;

			if ((!command.description || command.description.length >= 100 || command.description.length) <= 0 && (command.type === 'CHAT_INPUT')) {
				throw `Command ${command.name}'s description must be between 1 and 100 characters.`;
			}

			command.category = dirs[dirs.length - 2];

			commands.push({
				name: command.name,
				description: command.description,
				options: command?.options || [],
				defaultPermission: false
			});
		}
		await interaction.channel.send(`Clearing ${BOT.NAME}'s commands...`);
		await interaction.guild.commands.set([]);
		await interaction.channel.send(`Setting ${BOT.NAME}'s commands...`);
		await interaction.guild.commands.set(commands);
		await interaction.followUp(`Successfully refreshed ${BOT.NAME}'s commands. Restarting...`);
		interaction.client.user.setActivity(`Restarting...`, { type: 'PLAYING' });
		interaction.channel.send(`Restarting ${BOT.NAME}`)
			.then(() => {
				interaction.client.destroy();
				process.exit(0);
			});
	}

}
