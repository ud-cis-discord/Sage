import { staffPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { BOT } from '@root/config';
import { MessageEmbed, Message } from 'discord.js';

export default class extends Command {

	aliases = ['lmgt', 'lmg'];
	description = `Have ${BOT.NAME} google something for someone`;
	usage = '<query>';

	async permissions(msg: Message): Promise<boolean> {
		return staffPerms(msg);
	}

	async run(msg: Message, [query]: [string]): Promise<Message> {
		const formatted = query.replace(new RegExp(' ', 'g'), '+');
		const link = `https://letmegooglethat.com/?q=${formatted}`;
		const embed = new MessageEmbed({
			description: `[Let me Google that for you!](${link})`,
			color: 'LUMINOUS_VIVID_PINK'
		});
		return msg.channel.send({ embeds: [embed] });
	}

	argParser(_msg: Message, input: string): Array<string> {
		if (!input) throw `What do you want ${BOT.NAME} to google? (Usage: ${this.usage})`;
		else return [input];
	}

}
