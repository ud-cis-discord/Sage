import { staffPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { MessageEmbed, Message } from 'discord.js';

export default class extends Command {

	aliases = ['lmgt', 'lmg'];
	usage = 'Have Sage google something for someone';

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

}
