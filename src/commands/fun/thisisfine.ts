import { CommandInteraction } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Everything is fine... probably.';

	run(interaction: CommandInteraction): Promise<InteractionResponse<boolean> | void> {
		return interaction.reply({ files: [{
			attachment: `${__dirname}../../../../../assets/images/thisisfine.png`, //	aliases don't work for file uploads
			name: `this_is_fine.png`
		}] });
	}

}
