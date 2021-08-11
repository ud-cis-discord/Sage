import { BOT } from '@root/config';
import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `The ultimate battle of human vs program. Can you best ${BOT.NAME} in a round of rock paper scissors?`;
	usage = '<rock|paper|scissors>';
	aliases = ['rps'];
	choices = ['rock', 'paper', 'scissors'];

	run(msg: Message, [choice]: [string]): Promise<Message> {
		const botMove = this.choices[Math.floor(Math.random() * this.choices.length)];

		const winner = this.checkWinner(this.choices.indexOf(choice), this.choices.indexOf(botMove));

		return msg.channel.send(`You threw ${choice} and ${BOT.NAME} threw ${botMove}. ${winner} won!`);
	}

	checkWinner(playerNum: number, botNum: number): string {
		if (playerNum === botNum) return 'Nobody';
		if ((playerNum > botNum && playerNum - botNum === 1) || (botNum > playerNum && botNum - playerNum === 2)) {
			return 'You';
		} else {
			return BOT.NAME;
		}
	}


	argParser(msg: Message, input: string): [string] {
		input = input.trim().toLowerCase();

		if (!input || !this.choices.includes(input)) {
			throw `Usage: ${this.usage}`;
		}

		return [input];
	}

}
