import { Message } from 'discord.js';
import { botMasterPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';

export default class extends Command {

	aliases = ['ls', 'listcmd'];
	description = 'Show all commands, including disable commands.';

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	run(msg: Message): Promise<Message> {
		let commands = '+ Enabled\n- Disabled\n';

		msg.client.commands.forEach(command => {
			commands += `\n${command.enabled === false ? '-' : '+'} ${command.name}`;
		});

		return msg.channel.send(commands, { code: 'diff' });
	}

}
