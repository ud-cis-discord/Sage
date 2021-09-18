/* eslint-disable eqeqeq */
import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';
import { setTimeout } from 'timers';

const COIN_FLIP = ['You got: Heads!', 'You got: Tails!'];

export default class extends Command {

	description = 'Have Sage flip a coin for you!';
	aliases = ['flip', 'coin', 'cf'];

	async run(msg: Message): Promise<void> {
		const coinFlip = await msg.channel.send('flipping...');
		const result = COIN_FLIP[Math.floor(Math.random() * COIN_FLIP.length)];

		setTimeout(() => {
			if (result == COIN_FLIP[0]) {
				coinFlip.edit({ files: [{
					attachment: `${__dirname}../../../../../assets/images/steve_heads.png`, //	aliases don't work for file uploads
					name: `steve_heads.png`
				}] });
			} else {
				coinFlip.edit({ files: [{
					attachment: `${__dirname}../../../../../assets/images/steve_tails.png`, //	aliases don't work for file uploads
					name: `steve_tails.png`
				}] });
			}
			coinFlip.edit(result);
		}, 3000);
	}

}

