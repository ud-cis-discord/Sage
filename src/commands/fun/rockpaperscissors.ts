import { BOT } from '@root/config';
import { ButtonInteraction, ChatInputCommandInteraction, ActionRowBuilder, ButtonBuilder, EmbedBuilder, InteractionResponse, ButtonStyle } from 'discord.js';
import { Command } from '@lib/types/Command';
import { SageInteractionType } from '@lib/types/InteractionType';
import { buildCustomId, getDataFromCustomId } from '@lib/utils/interactionUtils';

const DECISION_TIMEOUT = 10;
const CHOICES = ['rock', 'paper', 'scissors'];

export default class extends Command {

	description = `The ultimate battle of human vs program. Can you best ${BOT.NAME} in a round of rock paper scissors?`;

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const choiceEmbed = new EmbedBuilder()
			.setTitle(`Make your choice, ${interaction.user.username}...`)
			.setColor('Red')
			.setFooter({ text: `You have ${DECISION_TIMEOUT} seconds to make up your mind.` });

		const timer = setInterval(this.timeoutMessage, DECISION_TIMEOUT * 1000, interaction);
		const confirmBtns = [
			new ButtonBuilder({
				label: 'Rock',
				customId: buildCustomId({
					type: SageInteractionType.RPS,
					commandOwner: interaction.user.id,
					additionalData: ['rock', `${timer[Symbol.toPrimitive]()}`]
				}),
				style: ButtonStyle.Primary,
				emoji: '👊'
			}),
			new ButtonBuilder({
				label: 'Paper',
				customId: buildCustomId({
					type: SageInteractionType.RPS,
					commandOwner: interaction.user.id,
					additionalData: ['paper', `${timer[Symbol.toPrimitive]()}`]
				}),
				style: ButtonStyle.Primary,
				emoji: '✋'
			}),
			new ButtonBuilder({
				label: 'Scissors',
				customId: buildCustomId({
					type: SageInteractionType.RPS,
					commandOwner: interaction.user.id,
					additionalData: ['scissors', `${timer[Symbol.toPrimitive]()}`]
				}),
				style: ButtonStyle.Primary,
				emoji: '✌'
			})
		];

		await interaction.reply({
			embeds: [choiceEmbed],
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore: you are literally the right type shut up
			components: [new ActionRowBuilder().addComponents(confirmBtns)]
		});

		return;
	}

	timeoutMessage(i: ChatInputCommandInteraction): void {
		const failEmbed = new EmbedBuilder()
			.setTitle(`${i.user.username} couldn't make up their mind! Command timed out.`)
			.setColor('Red');

		i.editReply({
			components: [],
			embeds: [failEmbed]
		});
	}

}

function checkWinner(playerNum: number, botNum: number): string {
	if (playerNum === botNum) return 'Nobody';
	if ((playerNum > botNum && playerNum - botNum === 1) || (botNum > playerNum && botNum - playerNum === 2)) {
		return 'You';
	} else {
		return BOT.NAME;
	}
}


export async function handleRpsOptionSelect(i: ButtonInteraction): Promise<void> {
	const interactionData = getDataFromCustomId(i.customId);
	const choice = interactionData.additionalData[0];
	const timer = interactionData.additionalData[1];
	if (i.user.id !== interactionData.commandOwner) {
		await i.reply({
			content: 'You cannot respond to a command you did not execute',
			ephemeral: true
		});
		return;
	}

	clearInterval(Number.parseInt(timer));
	const msg = await i.channel.messages.fetch(i.message.id);

	const botMove = CHOICES[Math.floor(Math.random() * CHOICES.length)];
	const winner = checkWinner(CHOICES.indexOf(choice), CHOICES.indexOf(botMove));

	let winEmbed: EmbedBuilder;

	if (winner === BOT.NAME) {
		winEmbed = new EmbedBuilder()
			.setTitle(`${i.user.username} threw ${choice} and ${BOT.NAME} threw ${botMove}. ${winner} won - the machine triumphs!`)
			.setColor('Red');
	} else if (winner === 'Nobody') {
		winEmbed = new EmbedBuilder()
			.setTitle(`Both ${i.user.username} and ${BOT.NAME} threw ${choice}. It's a draw!`)
			.setColor('Blue');
	} else {
		winEmbed = new EmbedBuilder()
			.setTitle(`${i.user.username} threw ${choice} and ${BOT.NAME} threw ${botMove}. ${i.user.username} won - humanity triumphs!`)
			.setColor('Green');
	}
	await msg.edit({
		components: [],
		embeds: [winEmbed]
	});
	await i.deferUpdate();

	return;
}
