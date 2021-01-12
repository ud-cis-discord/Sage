import { Message } from 'discord.js';
import { Snippet } from '@lib/types/Snippet';
import { ROLES } from '@root/config';

export const decirption = 'Easily access useful bits of information about the server.';
export const usage = '<list | run/view | add/new | update/edit | delete/remove> (snipName) | (snipContent)';
export const extendedHelp = 'If given no arguemnts, you will recive the list of all avaliable snippets. Only staff can edit snips.';
export const aliases = ['snip', 'snippet'];

type SnipCommand = 'list' | 'run' | 'add' | 'update' | 'delete';

export function run(msg: Message, [subCommand, snip, contents]: [SnipCommand, string, string]): Promise<Message> {
	return msg.channel.send(`**sub command**: ${subCommand}\n**snip**: ${snip}\n**content**: ${contents}`);
	// switch (subCommand) {
	// 	case 'run':
	// 		return msg.client.mongo.collection('snips').findOne({ name: snip })
	// 			.then((document: Snippet) => {
	// 				if (!document) {
	// 					return msg.channel.send(`There is no snippet with the name ${snip}`);
	// 				}
	// 				return msg.channel.send(document.content);
	// 			});
	// }
}


export function argParser(msg: Message, input: string): [SnipCommand, string, string] {
	const isStaff = msg.member.roles.cache.has(ROLES.STAFF);

	let subCommand: SnipCommand;
	let snip: string;
	let contents: string;

	switch (input.split(' ')[0]) {
		case 'add':
		case 'new':
			if (!isStaff) throw 'You do not have permssion to do that.';
			if (!input.includes('|')) throw usage;
			subCommand = 'add';
			[snip, contents] = input.split('|');
			[, snip] = snip.split(' ');
			break;
		case 'update':
		case 'edit':
			if (!isStaff) throw 'You do not have permssion to do that.';
			if (!input.includes('|')) throw usage;
			subCommand = 'update';
			[snip, contents] = input.split('|');
			[, snip] = snip.split(' ');
			break;
		case 'delete':
		case 'remove':
			if (!isStaff) throw 'You do not have permssion to do that.';
			subCommand = 'delete';
			[, snip] = input.split(' ');
			if (!snip) throw 'Invalid snippet name';
			break;
		case 'list':
		case '':
			subCommand = 'list';
			break;
		default:
			subCommand = 'run';
			if (input.includes(' ')) {
				[, snip] = input.split(' ');
			} else {
				snip = input;
			}
	}

	if (snip !== undefined && (snip.includes(' ') || snip === '')) throw 'Invalid snippet name';

	return [subCommand, snip, contents];
}
