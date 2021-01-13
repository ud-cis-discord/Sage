import { staffPerms } from '@lib/permissions';
import { userParser } from '@root/src/lib/arguments';
import { GuildMember, Message } from 'discord.js';

export const description = 'Resets a given user\'s message count.';
export const usage = '<user>|[to_subtract|to_set_to]';
export const extendedHelp = `Using with no value will reset to 0. A positive integer will
set their message count and a negative will subtract that from their total`;
export const runInDM = false;
export const aliases = ['reset'];

export function permissions(msg: Message): boolean {
	return staffPerms(msg);
}

export function run(msg: Message): Promise<Message> {

}

export async function argParser(msg: Message, input: string): Promise<[GuildMember]> {
	return [await userParser(msg, input)];
}
