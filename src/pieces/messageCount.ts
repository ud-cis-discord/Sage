import { Client, TextChannel, User, Message } from 'discord.js';
import { DB, PREFIX } from '@root/config';
import { SageUser } from '@lib/types/SageUser';

const levelFactor = 1.1;
const firstLevel = 10;

function register(bot: Client): void {
	bot.on('message', async msg => {
		if (msg.channel.type !== 'text' || msg.content.toLowerCase().startsWith(PREFIX) || msg.author.bot) {
			return;
		}

		const channel = msg.channel as TextChannel;

		const entry: SageUser = await bot.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });

		if (!entry) {
			throw `member ${msg.author.username} (${msg.author.id}) not in database`;
		}

		if (channel.topic && !channel.topic.startsWith('[no message count]')) {
			entry.count++;
		}

		if (++entry.exp > (firstLevel * entry.level * levelFactor)) {
			if (entry.levelPings) {
				sendLevelPing(msg.author);
			}
			entry.level++;
		}

		await bot.mongo.collection(DB.USERS).updateOne({ discordId: msg.author.id }, { $set: { ...entry } });
	});
}

function sendLevelPing(user: User): Promise<Message> {
	return user.send('you leveled up, woo.');
}

export default register;
