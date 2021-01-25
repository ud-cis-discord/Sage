import { Client, TextChannel, Message, MessageEmbed, Role } from 'discord.js';
import { DB, PREFIX, ROLES } from '@root/config';
import { SageUser } from '@lib/types/SageUser';

const xpRatio = 1.25;
const startingColor = 80;
const greenIncrement = 8;

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

		if (!channel.topic || (channel.topic && !channel.topic.startsWith('[no message count]'))) {
			entry.count++;
		}

		if (--entry.curExp <= 0) {
			entry.curExp = entry.levelExp = Math.floor(entry.levelExp * xpRatio);
			entry.level++;
			if (entry.levelPings) {
				sendLevelDM(msg, entry);
			}
			let addRole: Role;
			if (!(addRole = msg.guild.roles.cache.find(r => r.name === `Level ${entry.level}`))) { // make a new level role if it doesn't exist
				addRole = await msg.guild.roles.create({
					data: {
						name: `Level ${entry.level}`,
						color: createLevelHex(entry.level),
						position: msg.guild.roles.cache.get(ROLES.VERIFIED).position + 1,
						permissions: 0
					}
				});
			}
			msg.member.roles.remove(msg.member.roles.cache.find(r => r.name.startsWith('Level'))).catch(); // remove old level role
			msg.member.roles.add(addRole);
		}

		await bot.mongo.collection(DB.USERS).updateOne({ discordId: msg.author.id }, { $set: { ...entry } });
	});
}

async function sendLevelDM(msg: Message, user: SageUser): Promise<Message> {
	let embedText: string;
	if (startingColor + (user.level * greenIncrement) >= 255 - greenIncrement) {
		embedText = `Congratulations, you have advanced to level ${user.level}!
		\nYou're about as green as you can get, but keep striving for higher levels to show off to your friends!`;
	} else {
		embedText = `Congratulations, you have advanced to level ${user.level}!\n Keep up the great work!`;
	}
	const embed = new MessageEmbed()
		.setThumbnail(msg.client.user.avatarURL())
		.setTitle('<:stevepeace:746223639770431578> Level up!')
		.setDescription(embedText)
		.addField('XP to next level:', user.levelExp, true)
		.setColor(createLevelHex(user.level));

	return msg.author.send(embed);
}

function createLevelHex(level: number): string {
	return `#${[2, Math.min(startingColor + (level * greenIncrement), 255), 0]
		.map(val => val.toString(16).padStart(2, '0')).join('')}`;
}

export default register;
