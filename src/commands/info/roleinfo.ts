

import { SageClient } from '@root/src/lib/types/SageClient';
import { Message } from 'discord.js';


/* Takes one argument, a role name. Sends the current number of users in a
given role and a list of those users. If the list is too long to be sent in an embed,
it should be uploaded to pastebin or similar and a link to the upload should be sent. */

export function run(msg: Message, [rolename]: [string]): Promise<Message> {
	return msg.channel.send('garbage');
}

export function argParser(msg: Message, input: string): Array<string> {
	const bot = msg.client as SageClient;

	return [input];
}
