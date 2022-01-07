import { Formatters, Message } from 'discord.js';
import { botMasterPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';

export default class extends Command {

	aliases = ['ls', 'listcmd'];
	description = 'Show all commands, including disable commands.';

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	run(msg: Message, [restricted]: [string]): Promise<Message> {
		const keywords = ['restricted', 'restrict', 'res', 'r'];

		if (keywords.includes(restricted)) {
			let commands = '[ Restricted ]\n.Unrestricted\n';

			msg.client.commands.forEach(command => {
				commands += `\n${command.restricted === true ? `[ ${command.name} ]` : `.${command.name}`} `;
			});

			return msg.channel.send(Formatters.codeBlock('css', commands));
		}
		let commands = '+ Enabled\n- Disabled\n';

		msg.client.commands.forEach(command => {
			commands += `\n${command.enabled === false ? '-' : '+'} ${command.name}`;
		});

		return msg.channel.send(Formatters.codeBlock('diff', commands));
	}

}
