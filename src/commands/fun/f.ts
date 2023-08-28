import { ApplicationCommandOptionData, ApplicationCommandOptionType, ChatInputCommandInteraction, GuildMember, InteractionResponse } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Press F to pay respects.';
	options: ApplicationCommandOptionData[] = [
		{
			name: 'target',
			description: 'The user to pay respects to',
			type: ApplicationCommandOptionType.User,
			required: false
		}
	]

	run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const target = interaction.options.getMember('target') as GuildMember;
		const replyContent = `${interaction.user.username} paid their respects ${target ? `to ${target.user.username}` : ``}`;
		return interaction.reply({ files: [{
			attachment: `${__dirname}../../../../../assets/images/f.png`,
			name: 'pay_respects.png'
		}], content: replyContent });
	}

}
