/* eslint-disable @typescript-eslint/no-empty-function */
/* eslint-disable no-trailing-spaces */
/* eslint-disable no-empty-function */
import { Message } from 'discord.js';
import { botMasterPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Restrict a command to #sages_place';
	usage = '<command>';

	async permissions(msg: Message): Promise<boolean> {
		return await botMasterPerms(msg);
	}

	async run(msg: Message, [command]: [Command]): Promise<Message> {
		if (command.restricted) return msg.channel.send(`${command.name} is already restricted.`);

		command.restricted = true;
		msg.client.commands.set(command.name, command);
	}

}
