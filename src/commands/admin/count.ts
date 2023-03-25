import { ADMIN_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { ApplicationCommandOptionData, ApplicationCommandPermissions, CategoryChannel, CommandInteraction } from 'discord.js';

export default class extends Command {

	description = 'Count channels in a category, use during archiving';
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'category',
		description: 'The name of the category you want to check (forum channels not included).',
		type: 'CHANNEL',
		required: true
	}];

	async run(interaction: CommandInteraction): Promise<InteractionResponse<boolean> | void> {
		// grab channel from command parameter
		const category = (interaction.options as CommandInteractionOptionResolver).getChannel('category') as CategoryChannel;
		let channelCount = 0;
		try {
			channelCount = category.children.size;
			return interaction.reply({ content: `**${category}** has **${channelCount}** channel(s)!`, ephemeral: true });
		} catch (error) {
			return interaction.reply({ content: `That's not a valid channel category.`, ephemeral: true });
		}
	}

}
