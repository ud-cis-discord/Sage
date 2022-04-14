import { BOT } from '@root/config';
import { ButtonInteraction, Client, CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import { Command } from '@lib/types/Command';
import { SageInteractionType } from '@lib/types/InteractionType';
import { buildCustomId, getDataFromCustomId } from '@lib/utils/interactionUtils';

const DECISION_TIMEOUT = 10;
const CHOICES = ['rock', 'paper', 'scissors'];

export default class extends Command {

	description = `The ultimate battle of human vs program. Can you best ${BOT.NAME} in a round of rock paper scissors?`;

	async run(interaction: CommandInteraction): Promise<void> {
		const choiceEmbed = new MessageEmbed()
			.setTitle(`Make your choice, ${interaction.user.username}...`)
			.setColor('RED')
			.setFooter(`You have ${DECISION_TIMEOUT} seconds to make up your mind.`);

		const timer = setInterval(this.timeoutMessage, DECISION_TIMEOUT * 1000, interaction);
		const confirmBtns = [
			new MessageButton({
				label: 'Rock',
				customId: buildCustomId(SageInteractionType.RPS,
					interaction.user.id, ['rock', `${timer[Symbol.toPrimitive]()}`]),
				style: 'PRIMARY',
				emoji: '👊'
			}),
			new MessageButton({
				label: 'Paper',
				customId: buildCustomId(SageInteractionType.RPS,
					interaction.user.id, ['paper', `${timer[Symbol.toPrimitive]()}`]),
				style: 'PRIMARY',
				emoji: '✋'
			}),
			new MessageButton({
				label: 'Scissors',
				customId: buildCustomId(SageInteractionType.RPS,
					interaction.user.id, ['scissors', `${timer[Symbol.toPrimitive]()}`]),
				style: 'PRIMARY',
				emoji: '✌'
			})
		];

		await interaction.reply({
			embeds: [choiceEmbed],
			components: [new MessageActionRow({ components: confirmBtns })]
		});

		return;
	}

	timeoutMessage(i: CommandInteraction): void {
		const failEmbed = new MessageEmbed()
			.setTitle(`${i.user.username} couldn't make up their mind! Command timed out.`)
			.setColor('RED');

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

	let winEmbed: MessageEmbed;

	if (winner === BOT.NAME) {
		winEmbed = new MessageEmbed()
			.setTitle(`${i.user.username} threw ${choice} and ${BOT.NAME} threw ${botMove}. ${winner} won - the machine triumphs!`)
			.setColor('RED');
	} else if (winner === 'Nobody') {
		winEmbed = new MessageEmbed()
			.setTitle(`Both ${i.user.username} and ${BOT.NAME} threw ${choice}. It's a draw!`)
			.setColor('BLUE');
	} else {
		winEmbed = new MessageEmbed()
			.setTitle(`${i.user.username} threw ${choice} and ${BOT.NAME} threw ${botMove}. ${i.user.username} won - humanity triumphs!`)
			.setColor('GREEN');
	}
	await msg.edit({
		components: [],
		embeds: [winEmbed]
	});
	await i.deferUpdate();

	return;
}
