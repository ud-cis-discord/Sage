import { BOT } from '@root/config';
import { ButtonInteraction, CommandInteraction, Message, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { Command } from '@lib/types/Command';

const DECISION_TIMEOUT = 10;
const CHOICES = ['rock', 'paper', 'scissors'];

export default class extends Command {

	description = `The ultimate battle of human vs program. Can you best ${BOT.NAME} in a round of rock paper scissors?`;

	run(_msg: Message): Promise<void> { return; }

	async tempRun(interaction: CommandInteraction): Promise<void> {
		let timeout = DECISION_TIMEOUT;
		const choiceEmbed = new MessageEmbed()
			.setTitle(`Make your choice, ${interaction.user.username}...`)
			.setColor('RED')
			.setFooter(`You have ${timeout} seconds to make up your mind.`);

		const confirmBtns = [
			new MessageButton({ label: 'Rock', customId: 'rock', style: 'PRIMARY', emoji: '👊' }),
			new MessageButton({ label: 'Paper', customId: 'paper', style: 'PRIMARY', emoji: '✋' }),
			new MessageButton({ label: 'Scissors', customId: 'scissors', style: 'PRIMARY', emoji: '✌' })
		];

		await interaction.reply({
			embeds: [choiceEmbed],
			components: [new MessageActionRow({ components: confirmBtns })]
		});

		let replyId;
		interaction.fetchReply().then(reply => { replyId = reply.id; });

		const collector = interaction.channel.createMessageComponentCollector({
			max: 1,
			time: DECISION_TIMEOUT * 1000,
			filter: i => i.user.id === interaction.user.id && i.message.id === replyId
		});

		const countdown = setInterval(() => this.countdown(interaction, --timeout, confirmBtns, choiceEmbed), 1000);

		collector.on('collect', async (i: ButtonInteraction) => {
			if (interaction.user.id !== i.user.id) {
				await interaction.reply({
					content: 'You cannot respond to a command you did not execute',
					ephemeral: true
				});
				return;
			}

			const botMove = CHOICES[Math.floor(Math.random() * CHOICES.length)];
			const winner = this.checkWinner(CHOICES.indexOf(i.customId), CHOICES.indexOf(botMove));

			clearInterval(countdown);
			let winEmbed: MessageEmbed;

			if (winner === BOT.NAME) {
				winEmbed = new MessageEmbed()
					.setTitle(`${interaction.user.username} threw ${i.customId} and ${BOT.NAME} threw ${botMove}. ${winner} won - the machine triumphs!`)
					.setColor('RED');
			} else if (winner === 'Nobody') {
				winEmbed = new MessageEmbed()
					.setTitle(`Both ${interaction.user.username} and ${BOT.NAME} threw ${i.customId}. It's a draw!`)
					.setColor('BLUE');
			} else {
				winEmbed = new MessageEmbed()
					.setTitle(`${interaction.user.username} threw ${i.customId} and ${BOT.NAME} threw ${botMove}. ${interaction.user.username} won - humanity triumphs!`)
					.setColor('GREEN');
			}
			await interaction.editReply({
				components: [],
				embeds: [winEmbed]
			});
		}).on('end', async collected => {
			const validCollected = collected.filter(i => i.isButton()
			&& i.message.id === interaction.id
			&& i.user.id === interaction.user.id);

			clearInterval(countdown);

			if (timeout === 1 && validCollected.size === 0) { // when clearInterval is used, timeout sticks to 1 second
				const failEmbed = new MessageEmbed()
					.setTitle(`${interaction.user.username} couldn't make up their mind! Command timed out.`)
					.setColor('RED');

				await interaction.editReply({
					components: [],
					embeds: [failEmbed]
				});
				return;
			}
		});
		return;
	}

	countdown(interaction: CommandInteraction, timeout: number, btns: MessageButton[], embed: MessageEmbed): void {
		const footerText = timeout > 1
			? `You have ${timeout} seconds to make up your mind.`
			: `You have ${timeout} second to make up your mind.`;
		embed.setFooter(footerText);
		interaction.editReply({ embeds: [embed], components: [new MessageActionRow({ components: btns })] });
	}

	checkWinner(playerNum: number, botNum: number): string {
		if (playerNum === botNum) return 'Nobody';
		if ((playerNum > botNum && playerNum - botNum === 1) || (botNum > playerNum && botNum - playerNum === 2)) {
			return 'You';
		} else {
			return BOT.NAME;
		}
	}

}
