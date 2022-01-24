import { Command } from '@root/src/lib/types/Command';
import { CommandInteraction, Message, MessageEmbed } from 'discord.js';

export default class extends Command {

	description = `Archive a private question thread.`;
	extendedHelp = `This command only works in private question threads.`;

	run(_msg: Message): Promise<void> { return; }

	async tempRun(interaction: CommandInteraction): Promise<void> {
		if (!interaction.channel.isThread()) {
			const responseEmbed = new MessageEmbed()
				.setTitle('Error')
				.setDescription('You must run this command in a private question thread.')
				.setColor('RED');
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		}
		interaction.reply(`Archiving thread...`);
		await interaction.channel.setArchived(true, `${interaction.user.username} archived the question.`);
		interaction.editReply(`Thread archived.`);
	}

}
