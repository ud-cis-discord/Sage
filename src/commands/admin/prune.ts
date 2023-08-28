import { Command } from '@lib/types/Command';
import { ROLES } from '@root/config';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { ApplicationCommandPermissions, ChatInputCommandInteraction, InteractionResponse } from 'discord.js';

export default class extends Command {

	description = `Prunes all members who don't have the <@&${ROLES.VERIFIED}> role`;
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = BOTMASTER_PERMS;

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		// let timeout = PRUNE_TIMEOUT;

		// await interaction.guild.members.fetch();
		// const toKick = interaction.guild.members.cache.filter(member => !member.user.bot && !member.roles.cache.has(ROLES.VERIFIED));
		// if (toKick.size === 0) return interaction.reply('No prunable members.');

		// const confirmEmbed = new EmbedBuilder()
		// 	.setTitle(`Server prune will kick ${toKick.size} members from the guild. Proceed?`)
		// 	.setColor('Red')
		// 	.setFooter({ text: `This command will expire in ${PRUNE_TIMEOUT}s` });

		// const confirmBtns = [
		// 	new MessageButton({ label: 'Cancel', customId: 'cancel', style: 'SECONDARY' }),
		// 	new MessageButton({ label: 'Proceed', customId: 'proceed', style: 'DANGER' })
		// ];

		// const confirmMsg = await interaction.channel.send({
		// 	embeds: [confirmEmbed],
		// 	components: [new ActionRowBuilder({ components: confirmBtns })]
		// });

		// const collector = interaction.channel.createMessageComponentCollector({
		// 	filter: i => i.message.id === confirmMsg.id, time: PRUNE_TIMEOUT * 1000
		// });

		// const countdown = setInterval(() => this.countdown(confirmMsg, --timeout, confirmBtns, confirmEmbed), 1000);

		// collector.on('collect', async (btnClick: ButtonInteraction) => {
		// 	if (btnClick.user.id !== interaction.user.id) {
		// 		return await interaction.reply({
		// 			content: 'You cannot respond to a command you did not execute.',
		// 			ephemeral: true
		// 		});
		// 	}
		// 	interaction.deferReply({ ephemeral: true });
		// 	clearInterval(countdown);

		// 	confirmBtns.forEach(btn => btn.setDisabled(true));


		// 	if (btnClick.customId === 'cancel') {
		// 		confirmEmbed.setColor('BLUE')
		// 			.setTitle(`Prune cancelled. ${interaction.user.username} got cold feet!`);
		// 		confirmMsg.edit({ embeds: [confirmEmbed], components: [new ActionRowBuilder({ components: confirmBtns })] });
		// 	} else {
		// 		confirmEmbed.setTitle(`<a:loading:928003042954059888> Pruning ${toKick.size} members...`);
		// 		confirmMsg.edit({ embeds: [confirmEmbed], components: [new ActionRowBuilder({ components: confirmBtns })] });

		// 		const awaitedKicks: Promise<GuildMember>[] = [];
		// 		toKick.forEach(member => {
		// 			awaitedKicks.push(member.kick(`Pruned by ${interaction.user.username} (${interaction.user.id})`));
		// 			return;
		// 		});
		// 		await Promise.all(awaitedKicks);

		// 		confirmEmbed.setTitle(`:white_check_mark: Pruned ${toKick.size} members!`);
		// 		confirmMsg.edit({
		// 			embeds: [confirmEmbed],
		// 			components: [new ActionRowBuilder({ components: confirmBtns })]
		// 		});
		// 	}
		// 	collector.stop();
		// }).on('end', async collected => {
		// 	const validCollected = collected.filter(i => i.isButton()
		// 	&& i.message.id === confirmMsg.id
		// 	&& i.user.id === interaction.user.id);

		// 	if (validCollected.size === 0) {
		// 		clearInterval(countdown);
		// 		confirmBtns.forEach(btn => btn.setDisabled(true));
		// 		confirmEmbed.setColor('BLUE').setDescription('Prune timed out.');
		// 	}
		// 	confirmEmbed.setFooter({ text: '' });
		// 	confirmMsg.edit({ embeds: [confirmEmbed], components: [new ActionRowBuilder({ components: confirmBtns })] });

		// 	collected.forEach(interactionX => {
		// 		if (validCollected.has(interactionX.id)) interactionX.followUp({ content: 'Done!' });
		// 	});
		// });

		return interaction.reply('To be implemented again soon...');
	}

	// countdown(msg: Message, timeout: number, confirmBtns: MessageButton[], confirmEmbed: EmbedBuilder): void {
	// 	confirmEmbed.setFooter({ text: `This command will expire in ${timeout}s` });
	// 	msg.edit({ embeds: [confirmEmbed], components: [new ActionRowBuilder({ components: confirmBtns })] });
	// }

}

