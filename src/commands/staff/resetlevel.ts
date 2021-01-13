import { staffPerms } from '@lib/permissions';
import { userParser } from '@lib/arguments';
import { SageUser } from '@lib/types/SageUser';
import { GuildMember, Message } from 'discord.js';
import { MAINTAINERS } from '@root/config';

export const description = 'Resets a given user\'s message count.';
export const usage = '<user>|[to_subtract|to_set_to]';
export const extendedHelp = `Using with no value will reset to 0. A positive integer will
set their message count and a negative will subtract that from their total`;
export const runInDM = false;
export const aliases = ['reset'];

export function permissions(msg: Message): boolean {
	return staffPerms(msg);
}

export async function run(msg: Message, [member, amount]: [GuildMember, number]): Promise<Message> {
	const entry: SageUser = await msg.client.mongo.collection('users').findOne({ discordId: member.user.id });

	if (!entry) {
		throw `User ${member.user.username} (${member.user.id}) not in database. Contact ${MAINTAINERS} 
		if you think this is an error.`;
	}

	let retStr: string;

	if (amount < 0) {
		entry.count += amount;
		retStr = `Subtracted ${amount * -1} from ${member.user.username}'s message count.`;
	} else {
		entry.count = amount;
		retStr = `Set ${member.user.username}'s message count to ${amount}.`;
	}

	await msg.client.mongo.collection('users').updateOne(
		{ discordId: member.user.id },
		{ $set: { count: entry.count } });

	return msg.channel.send(retStr);
}

export async function argParser(msg: Message, input: string): Promise<[GuildMember, number]> {
	const [member, option] = input.trim().split('|');

	let amount: number;

	if (option && typeof (amount = parseInt(option.trim())) !== 'number') {
		throw `Usage: ${usage}`;
	}
	if (!option) {
		amount = 0;
	}

	return [await userParser(msg, member.trim()), amount];
}
