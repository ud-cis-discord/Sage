import { staffPerms } from '@lib/permissions';
import { ROLES } from '@root/config';
import { userParser } from '@lib/arguments';
import { Message, GuildMember } from 'discord.js';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Gives the muted role to the given user.';
	usage = '<user>';
	runInDM = false;

	permissions(msg: Message): boolean {
		return staffPerms(msg);
	}

	async run(msg: Message, [member]: [GuildMember]): Promise<Message> {
		if (member.roles.cache.has(ROLES.MUTED)) {
			const reason = `${member.user.username} was un-muted by ${msg.author.tag} (${msg.author.id})`;
			member.roles.remove(ROLES.MUTED, reason);
			return msg.channel.send(`${member.user.username} has been un-muted.`);
		}
		const reason = `${member.user.username} was muted by ${msg.author.tag} (${msg.author.id})`;
		member.roles.add(ROLES.MUTED, reason);
		return msg.channel.send(`${member.user.username} has been muted.`);
	}

	async argParser(msg: Message, input: string): Promise<Array<GuildMember>> {
		return [await userParser(msg, input)];
	}

}
