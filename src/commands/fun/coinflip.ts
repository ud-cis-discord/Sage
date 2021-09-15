/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable eqeqeq */
import { Message } from 'discord.js';
import { Command } from '@lib/types/Command';
import { setTimeout } from 'timers';

const COIN_FLIP = ['You got: Heads!', 'You got: Tails!'];

export default class extends Command {

	description = 'Have Sage flip a coin for you!';
	aliases = ['flip', 'coin', 'cf'];

	async run(msg: Message) {
		const coinFlip = await msg.channel.send('flipping...');
		const coinImage = await msg.channel.send({ files: [{
			attachment: `${__dirname}../../../../../assets/images/coinflip.gif`,
			name: `coin_flip.gif`
		}] });

		const result = COIN_FLIP[Math.floor(Math.random() * COIN_FLIP.length)];

		setTimeout(() => {
			coinImage.delete();
			if (result == COIN_FLIP[0]) {
				coinFlip.edit({ files: [{
					attachment: `${__dirname}../../../../../assets/images/steve_heads.png`,
					name: `steve_heads.png`
				}] });
			} else {
				coinFlip.edit({ files: [{
					attachment: `${__dirname}../../../../../assets/images/steve_tails.png`,
					name: `steve_tails.png`
				}] });
			}
			coinFlip.edit(result);
		}, 3000);
	}

}

