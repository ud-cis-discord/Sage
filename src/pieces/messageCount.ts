import { Client, TextChannel, Role, Message, MessageEmbed } from 'discord.js';
import { DatabaseError } from '@lib/types/errors';
import { CHANNELS, PREFIX, DB, ROLES, GUILDS } from '@root/config';
import { SageUser } from '@lib/types/SageUser';

const xpRatio = 1.25;
const startingColor = 80;
const greenIncrement = 8;
const maxGreen:[number, number, number] = [0, 255, 0];
const maxLevel = 20;
const countedChannelTypes = [
	'GUILD_TEXT',
	'GUILD_PUBLIC_THREAD'
];

async function register(bot: Client): Promise<void> {
	bot.on('messageCreate', async msg => {
		countMessages(msg).catch(async error => bot.emit('error', error));
	});
}

async function countMessages(msg: Message): Promise<void> {
	const bot = msg.client;

	if (
		!countedChannelTypes.includes(msg.channel.type)
		|| msg.guild?.id !== GUILDS.MAIN
		|| msg.content.toLowerCase().startsWith(PREFIX)
		|| msg.author.bot
	) {
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
		(err, { value }) => handleLevelUp(err, value as SageUser, msg)
			.catch(async error => bot.emit('error', error))
	);
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
				name: `Level ${entry.level}`,
				color: createLevelRgb(entry.level),
				position: msg.guild.roles.cache.get(ROLES.VERIFIED).position + 1,
				permissions: BigInt(0),
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
				name: `Power User`,
				color: maxGreen,
				position: msg.guild.roles.cache.get(ROLES.VERIFIED).position + 1,
				permissions: BigInt(0),
				reason: `${msg.author.username} is the first to become a power user!`
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
		.setTitle('<:steve_peace:883541149032267816> Level up!')
		.setDescription(embedText)
		.addField('XP to next level:', user.levelExp.toString(), true)
		.setColor(createLevelRgb(user.level))
		.setFooter('You can turn the messages off by using the `/togglelevelpings` command')
		.setTimestamp();

	// eslint-disable-next-line no-extra-parens
	return (msg.guild.channels.cache.get(CHANNELS.SAGE) as TextChannel).send({
		content: `${msg.member}, you have leveled up!`,
		embeds: [embed]
	});
}

function createLevelRgb(level: number): [number, number, number] {
	return [2, Math.min(startingColor + (level * greenIncrement), 255), 0];
}

export default register;
