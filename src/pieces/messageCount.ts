import { Client, TextChannel, Role, Message, MessageEmbed } from 'discord.js';
import { generateLogEmbed } from '@lib/utils';
import { DatabaseError } from '@lib/types/errors';
import { LOG, PREFIX, DB, ROLES } from '@root/config';
import { SageUser } from '@lib/types/SageUser';

const xpRatio = 1.25;
const startingColor = 80;
const greenIncrement = 8;
const maxGreen = '00ff00';
const maxLevel = 20;

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(LOG.ERROR) as TextChannel;
	bot.on('message', async msg => countMessages(msg, errLog)
		.catch(async error => errLog.send(await generateLogEmbed(error)))
	);
}

async function countMessages(msg: Message, errLog: TextChannel): Promise<void> {
	const bot = msg.client;

	if (msg.channel.type !== 'text' || msg.content.toLowerCase().startsWith(PREFIX) || msg.author.bot) {
		return;
	}

	const channel = msg.channel as TextChannel;

	let countInc = 0;
	if (!channel.topic || (channel.topic && !channel.topic.startsWith('[no message count]'))) {
		countInc++;
	}


	bot.mongo.collection(DB.USERS).findOneAndUpdate(
		{ discordId: msg.author.id },
		{ $inc: { count: countInc, curExp: -1 } },
		(err, value) => handleLevelUp(err, value as SageUser, msg)
			.catch(async error => errLog.send(await generateLogEmbed(error))));

	// .then(async updated => {
	// 	if (updated.modifiedCount === 0) {
	// 		errLog.send(await generateLogEmbed(new DatabaseError(`Member ${msg.author.username} (${msg.author.id}) not in database`)));
	// 	}
	// } );
}

async function handleLevelUp(err: Error, entry: SageUser, msg: Message): Promise<void> {
	if (err) {
		throw err;
	}

	if (!entry) {
		throw new DatabaseError(`Member ${msg.author.username} (${msg.author.id}) not in database`);
	}

	if (--entry.curExp <= 0) {
		entry.curExp = entry.levelExp = Math.floor(entry.levelExp * xpRatio);
		entry.level++;
		if (entry.levelPings) {
			sendLevelPing(msg, entry);
		}
		let addRole: Role;
		if (!(addRole = msg.guild.roles.cache.find(r => r.name === `Level ${entry.level}`))
			&& entry.level <= maxLevel) { // make a new level role if it doesn't exist
			addRole = await msg.guild.roles.create({
				data: {
					name: `Level ${entry.level}`,
					color: createLevelHex(entry.level),
					position: msg.guild.roles.cache.get(ROLES.VERIFIED).position + 1,
					permissions: 0
				},
				reason: `${msg.author.username} is the first to get to Level ${entry.level}`
			});
		}

		if (entry.level <= maxLevel) {
			await msg.member.roles.remove(msg.member.roles.cache.find(r => r.name.startsWith('Level')), `${msg.author.username} leveled up.`);
			msg.member.roles.add(addRole, `${msg.author.username} leveled up.`);
		}

		if (entry.level > maxLevel
			&& !(addRole = msg.guild.roles.cache.find(r => r.name === `Power User`))) {
			addRole = await msg.guild.roles.create({
				data: {
					name: `Power User`,
					color: maxGreen,
					position: msg.guild.roles.cache.get(ROLES.VERIFIED).position + 1,
					permissions: 0
				}
			});
		}
		if (entry.level > maxLevel && !msg.member.roles.cache.find(r => r.name === 'Power User')) {
			msg.member.roles.remove(msg.member.roles.cache.find(r => r.name.startsWith('Level')), `${msg.author.username} leveled up.`);
			msg.member.roles.add(addRole, `${msg.author.username} leveled up.`);
		}

		msg.client.mongo.collection(DB.USERS).updateOne({ discordId: msg.author.id }, { $set: { ...entry } });
	}
}

async function sendLevelPing(msg: Message, user: SageUser): Promise<Message> {
	let embedText: string;
	if (startingColor + (user.level * greenIncrement) >= 255 - greenIncrement) {
		embedText = `Congratulations, you have advanced to level ${user.level}!
		\nYou're about as green as you can get, but keep striving for higher levels to show off to your friends!`;
	} else {
		embedText = `Congratulations ${msg.author.username}, you have advanced to level ${user.level}!\n Keep up the great work!`;
	}
	const embed = new MessageEmbed()
		.setThumbnail(msg.author.avatarURL())
		.setTitle('<:stevepeace:746223639770431578> Level up!')
		.setDescription(embedText)
		.addField('XP to next level:', user.levelExp, true)
		.setColor(createLevelHex(user.level));

	// eslint-disable-next-line no-extra-parens
	return (msg.guild.channels.cache.get(LOG.SAGE) as TextChannel).send(`${msg.member}, you have leveled up!`, embed);
}

function createLevelHex(level: number): string {
	return `#${[2, Math.min(startingColor + (level * greenIncrement), 255), 0]
		.map(val => val.toString(16).padStart(2, '0')).join('')}`;
}

export default register;
