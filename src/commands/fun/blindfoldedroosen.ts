import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `You've been challenged to a sword fight. However, your opponent, Professor Roosen, has decided to wear a blindfold. Feeling lucky?`;
	usage = '';
	aliases = ['br', 'blindfoldedroosen'];

	run(msg: Message): Promise<Message> {
		const chosenSword = Math.floor(Math.random() * 6);
		// 5 is a random number I chose to be the blindfolded Roosen, no other meaning
		if (chosenSword === 5) {
			return msg.channel.send('Ooooooooooooh... ouch! Roosen has accidentally killed you! You lose.');
		} else {
			return msg.channel.send('You\'ve won the fight against blindfolded Roosen. You live another day!');
		}
	}

}
