import { Client, TextChannel } from 'discord.js';
import { DB, PREFIX } from '@root/config';

function register(bot: Client): void {
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
			.then(updated => {
				if (updated.modifiedCount === 0) {
					throw `member ${msg.author.username} (${msg.author.id}) not in database`;
				}
			});
	});
}

export default register;
