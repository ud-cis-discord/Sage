import { Client, TextChannel } from 'discord.js';
import { PREFIX } from '@root/config';

function register(bot: Client): void {
	bot.on('message', async msg => {
		if (msg.channel.type !== 'text' || msg.author === bot.user) {
			return;
		}

		const channel = msg.channel as TextChannel;
		if (channel.topic && channel.topic.startsWith('[no message count]')) {
			return;
		}

		if (msg.content.toLowerCase().startsWith(PREFIX)) {
			return;
		}

		await bot.mongo.collection('users').updateOne(
			{ discordId: msg.author.id },
			{ $inc: { count: 1 } });
	});
}

export default register;
