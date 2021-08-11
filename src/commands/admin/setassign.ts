import { Message, Role } from 'discord.js';
import { AssignableRole } from '@lib/types/AssignableRole';
import { roleParser } from '@lib/arguments';
import { adminPerms } from '@lib/permissions';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Adds a role to the assignable collection of the database 
	if that role is not already in it. If the role is already in the collection, it removes it.`;
	usage = '<role>';
	aliases = ['addassign'];
	runInDM = false;

	permissions(msg: Message): boolean {
		return adminPerms(msg);
	}

	async run(msg: Message, [cmd]: [Role]): Promise<Message> {
		const assignables = msg.client.mongo.collection(DB.ASSIGNABLE);
		const newRole: AssignableRole = { id: cmd.id };

		if (await assignables.countDocuments(newRole) > 0) {
			assignables.findOneAndDelete(newRole);
			return msg.channel.send(`The role \`${cmd.name}\` has been removed.`);
		} else {
			assignables.insertOne(newRole);
			return msg.channel.send(`The role \`${cmd.name}\` has been added.`);
		}
	}

	async argParser(msg: Message, input: string): Promise<Array<Role>> {
		return [await roleParser(msg, input)];
	}

}
