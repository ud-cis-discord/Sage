import { Client, TextChannel } from 'discord.js';
import { PREFIX } from '@root/config';

function register(bot: Client): void {
	bot.on('message', async msg => {
		if (msg.channel.type !== 'text' || msg.content.toLowerCase().startsWith(PREFIX) || msg.author.bot) {
			return;
		}

		const channel = msg.channel as TextChannel;
		if (channel.topic && channel.topic.startsWith('[no message count]')) {
			return;
		}

		if (await bot.mongo.collection('users').countDocuments({ discordId: msg.author.id }) !== 1) {
			throw `member ${msg.author.username} (${msg.author.id}) not in database`;
		}

		await bot.mongo.collection('users').updateOne(
			{ discordId: msg.author.id },
			{ $inc: { count: 1 } });
	});
}

export default register;
