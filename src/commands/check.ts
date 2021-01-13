import { Message } from 'discord.js';
import { SageUser } from '@lib/types/SageUser';
import { MAINTAINERS } from '@root/config';

export const description = `Displays the users current message count. 
If the word 'here' is used as an argument, the message count will be 
sent in the same channel that the command was used in (rather than the user's dms).`;
export const usage = '[here]';
export const aliases = ['count'];

export async function run(msg: Message, [here]: [string]): Promise<void> {
	const user: SageUser = await msg.author.client.mongo.collection('users').findOne({ discordId: msg.author.id });

	if (!user) {
		msg.reply(`I couldn't find you in the database, if you think this is an error please contact ${MAINTAINERS}.`);
		return;
	}
	if (here === 'here') {
		msg.channel.send(`You have sent ${user.count} message${user.count === 1 ? '' : 's'}.`);
	} else {
		msg.author.send(`You have sent ${user.count} message${user.count === 1 ? '' : 's'}.`)
			.then(() => { if (msg.channel.type !== 'dm') msg.channel.send('Your message count has been sent to your DMs.'); })
			.catch(() => msg.channel.send('I couldn\'t send you a DM. Please enable DMs and try again.'));
	}
	return;
}
