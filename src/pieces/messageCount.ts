import { Client, TextChannel } from 'discord.js';
import { logError } from '@lib/utils';
import { DatabaseError } from '@lib/types/errors';
import { LOG, PREFIX, DB } from '@root/config';

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(LOG.ERROR) as TextChannel;
	bot.on('message', msg => {
		if (msg.channel.type !== 'text' || msg.content.toLowerCase().startsWith(PREFIX) || msg.author.bot) {
			return;
		}

		const channel = msg.channel as TextChannel;
		if (channel.topic && channel.topic.startsWith('[no message count]')) {
			return;
		}

		bot.mongo.collection(DB.USERS).updateOne(
			{ discordId: msg.author.id },
			{ $inc: { count: 1 } })
			.then(async updated => {
				if (updated.modifiedCount === 0) {
					errLog.send(await logError(new DatabaseError(`Member ${msg.author.username} (${msg.author.id}) not in database`)));
				}
			});
	});
}

export default register;
