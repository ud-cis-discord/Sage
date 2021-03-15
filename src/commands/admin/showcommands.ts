import { Message } from 'discord.js';
import { botMasterPerms } from '@lib/permissions';

export const aliases = ['ls', 'listcmd'];
export const description = 'Show all commands, including disable commands.';

export async function permissions(msg: Message): Promise<boolean> {
	return await botMasterPerms(msg);
}

export function run(msg: Message): Promise<Message> {
	let commands = '+ Enabled\n- Disabled\n';

	msg.client.commands.forEach(command => {
		commands += `\n${command.enabled === false ? '-' : '+'} ${command.name}`;
	});

	return msg.channel.send(commands, { code: 'diff' });
}
