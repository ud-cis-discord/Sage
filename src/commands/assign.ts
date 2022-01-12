import { Message, Role } from 'discord.js';
import { AssignableRole } from '@lib/types/AssignableRole';
import { roleParser } from '@lib/arguments';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Assign a role to yourself! Use \`/assign list\` to get the assignable roles`;
	usage = '[Role|list]';
	aliases = ['role'];
	runInDM = false;

	async run(msg: Message, [cmd]: [Role | 'list']): Promise<Message> {
		const assignables = msg.client.mongo.collection(DB.ASSIGNABLE);

		if (cmd === 'list') {
			return msg.channel.send('Here is the list of self-assignable roles:\n' +
				`\`${(await assignables.find().toArray()).map(a => msg.guild.roles.cache.get(a.id).name).sort().join('`, `')}\``);
		} else {
			const role: AssignableRole = { id: cmd.id };

			if (await assignables.countDocuments(role) === 1) {
				if (msg.member.roles.cache.has(role.id)) {
					msg.member.roles.remove(role.id);
					return msg.channel.send(`:no_entry: removed role: \`${cmd.name}\``);
				} else {
					msg.member.roles.add(role.id);
					return msg.channel.send(`:white_check_mark: added role: \`${cmd.name}\``);
				}
			}
		}
	}

	async argParser(msg: Message, input: string): Promise<Array<Role|string>> {
		if (input === 'list' || input === '') {
			return ['list'];
		}
		return [await roleParser(msg, input)];
	}

}
