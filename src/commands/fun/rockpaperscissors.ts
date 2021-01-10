import { BOT } from '@root/config';
import { Message } from 'discord.js';

export const description = `The ultimate battle of human vs program. Can you best ${BOT.NAME} in a round of rock paper scissors?`;
export const usage = '<rock|paper|scissors>';
export const aliases = ['rps'];
const choices = ['rock', 'paper', 'scissors'];

export function run(msg: Message, [choice]: [string]): Promise<Message> {
	const botMove = choices[Math.floor(Math.random() * choices.length)];

	const winner = checkWinner(choices.indexOf(choice), choices.indexOf(botMove));

	return msg.channel.send(`You threw ${choice} and ${BOT.NAME} threw ${botMove}. ${winner} won!`);
}

function checkWinner(playerNum: number, botNum: number): string {
	if (playerNum === botNum) return 'Nobody';
	if ((playerNum > botNum && playerNum - botNum === 1) || (botNum > playerNum && botNum - playerNum === 2)) {
		return 'You';
	} else {
		return BOT.NAME;
	}
}


export function argParser(msg: Message, input: string): [string] {
	input = input.trim().toLowerCase();

	if (!input || !choices.includes(input)) {
		throw `Usage: ${usage}`;
	}

	return [input];
}
