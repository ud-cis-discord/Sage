import { ApplicationCommandOptionData, CommandInteraction, GuildMember, Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Press F to pay respects';
	options: ApplicationCommandOptionData[] = [
		{
			name: 'target',
			description: '(Optional) The user to pay respects to',
			type: 'USER',
			required: false
		}
	]

	run(_msg: Message): Promise<void> { return; }

	tempRun(interaction: CommandInteraction): Promise<void> {
		const target = interaction.options.getMember('target') as GuildMember;
		const replyContent = target
			? `${interaction.user.username} paid their respects to ${target.user.username}`
			: `${interaction.user.username} paid their respects`;
		return interaction.reply({ files: [{
			attachment: `${__dirname}../../../../../assets/images/f.png`,
			name: 'pay_respects.png'
		}], content: replyContent });
	}

}
