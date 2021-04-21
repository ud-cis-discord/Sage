import { staffPerms } from '@lib/permissions';
import { MessageEmbed, Message } from 'discord.js';

export const aliases = ['lmgt', 'lmg'];
export const usage = 'Have Sage google something for someone';

export async function permissions(msg: Message): Promise<boolean> {
	return staffPerms(msg);
}

export async function run(msg: Message, [query]: [string]): Promise<Message> {
	const formatted = query.replace(new RegExp(' ', 'g'), '+');
	const link = `https://letmegooglethat.com/?q=${formatted}`;
	const embed = new MessageEmbed({
		description: `[Let me Google that for you!](${link})`,
		color: 'LUMINOUS_VIVID_PINK'
	});
	return msg.channel.send(embed);
}
