import { Command } from '@lib/types/Command';
import { ROLES } from '@root/config';
import { adminPerms } from '@root/src/lib/permissions';
import { Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';

const PRUNE_TIMEOUT = 30;

export default class extends Command {

	description = `Prunes all members who don't have the <@&${ROLES.VERIFIED}> role`;
	runInDM = false;

	permissions(msg: Message): boolean {
		return adminPerms(msg);
	}

	async run(msg: Message): Promise<void> {
		let timeout = PRUNE_TIMEOUT;
		msg.guild.members.fetch();
		const toKick = msg.guild.members.cache.filter(member => !member.user.bot && !member.roles.cache.has(ROLES.VERIFIED));

		const confirmEmbed = new MessageEmbed()
			.setTitle(`Server prune will kick ${toKick.size} members from the guild. Proceed?`)
			.setColor('RED')
			.setFooter(`This command will expire in ${PRUNE_TIMEOUT} seconds`);

		const confirmBtns = [
			new MessageButton({ label: 'Cancel', customId: 'cancel', style: 'SECONDARY' }),
			new MessageButton({ label: 'Proceed', customId: 'proceed', style: 'DANGER' })
		];

		const confirmMsg = await msg.channel.send({
			embeds: [confirmEmbed],
			components: [new MessageActionRow({ components: confirmBtns })]
		});

		const collector = msg.channel.createMessageComponentCollector({
			filter: i => i.message.id === confirmMsg.id, time: PRUNE_TIMEOUT * 1000
		});

		const countdown = setInterval(() => this.countdown(confirmMsg, --timeout, confirmBtns, confirmEmbed), 1000);

		collector.on('collect', async interaction => {
			if (!interaction.isButton()) return;
			if (interaction.user.id !== msg.author.id) {
				await interaction.reply({
					content: 'You cannot respond to a command you did not execute',
					ephemeral: true
				});
				return;
			}
			interaction.deferReply({ ephemeral: true });
			clearInterval(countdown);

			confirmBtns.forEach(btn => btn.setDisabled(true));


			if (interaction.customId === 'cancel') {
				confirmEmbed.setColor('BLUE')
					.setTitle(`Prune cancelled, ${msg.member.displayName} got cold feet!`);
				confirmMsg.edit({ embeds: [confirmEmbed], components: [new MessageActionRow({ components: confirmBtns })] });
			} else {
				confirmEmbed.setTitle(`<a:loading:928003042954059888> Pruning ${toKick.size} members...`);
				confirmMsg.edit({ embeds: [confirmEmbed], components: [new MessageActionRow({ components: confirmBtns })] });
				toKick.forEach(member => {
					console.log(`pruning ${member.displayName}`);
					return;
				});
				confirmEmbed.setTitle(`:white_check_mark: Pruned ${toKick.size} members!`);
				confirmMsg.edit({ embeds: [confirmEmbed], components: [new MessageActionRow({ components: confirmBtns })] });
			}
			collector.stop();
		}).on('end', async collected => {
			const validCollected = collected.filter(i => i.isButton()
			&& i.message.id === confirmMsg.id
			&& i.user.id === msg.author.id);

			if (validCollected.size === 0) {
				clearInterval(countdown);
				confirmBtns.forEach(btn => btn.setDisabled(true));
				confirmEmbed.setColor('BLUE').setDescription('Prune timed out.');
			}
			confirmEmbed.setFooter('');
			confirmMsg.edit({ embeds: [confirmEmbed], components: [new MessageActionRow({ components: confirmBtns })] });

			collected.forEach(interaction => {
				if (validCollected.has(interaction.id)) interaction.followUp({ content: 'Done!' });
			});
		});

		return;
	}

	countdown(msg: Message, timeout: number, confirmBtns: MessageButton[], confirmEmbed: MessageEmbed): void {
		confirmEmbed.setFooter(`This command will expire in ${timeout} seconds`);
		msg.edit({ embeds: [confirmEmbed], components: [new MessageActionRow({ components: confirmBtns })] });
	}

}

