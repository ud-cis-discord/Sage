import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Challenge a blindfolded Prof. Roosen to a sword fight!';
	extendedHelp = 'You\'ve been challenged to a sword fight. However, your opponent, Professor Roosen, has decided to wear a blindfold. Feeling lucky?';
	aliases = ['br', 'bfr'];

	run(msg: Message): Promise<Message> {
		const chosenSword = Math.floor(Math.random() * 6);
		// 5 is a random number I chose to be the blindfolded Roosen, no other meaning
		if (chosenSword === 5) {
			return msg.channel.send('Ooooooooooooh... ouch! Blindfolded Roosen has killed you! You lose.');
		} else {
			return msg.channel.send('You\'ve won the fight against blindfolded Roosen. You live another day!');
		}
	}

}
