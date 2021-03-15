import { Message, Role } from 'discord.js';
import { AssignableRole } from '@lib/types/AssignableRole';
import { roleParser } from '@lib/arguments';
import { adminPerms } from '@lib/permissions';
import { DB } from '@root/config';

export const description = `Adds a role to the assignable collection of the database 
if that role is not already in it. If the role is already in the collection, it removes it.`;
export const usage = '<role>';
export const aliases = ['addassign'];
export const runInDM = false;

export function permissions(msg: Message): boolean {
	return adminPerms(msg);
}

export async function run(msg: Message, [cmd]: [Role]): Promise<Message> {
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

export async function argParser(msg: Message, input: string): Promise<Array<Role>> {
	return [await roleParser(msg, input)];
}
