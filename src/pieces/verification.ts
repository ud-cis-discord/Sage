import { Client, Message, Guild, TextChannel } from 'discord.js';
import { generateLogEmbed } from '@lib/utils';
import { SageUser } from '@lib/types/SageUser';
import { DB, GUILDS, LOG, MAINTAINERS, ROLES } from '@root/config';

async function verify(msg: Message, bot: Client, guild: Guild) {
	if (msg.channel.type !== 'dm' || msg.content.trim().length !== 44 || msg.content.includes(' ')) return;

	const givenHash = msg.content.trim();

	if (await bot.mongo.collection(DB.USERS).countDocuments({ discordId: msg.author.id }) > 0) {
		return msg.reply(`Your Discord account has already been verified. Contact ${MAINTAINERS} if you think this is an error.`);
	}

	const entry: SageUser = await bot.mongo.collection(DB.USERS).findOne({ hash: givenHash });

	if (!entry) {
		return msg.reply(`I could not find that hash in the database. Please try again or contact ${MAINTAINERS}.`);
	}

	if (entry.isVerified) return;

	entry.isVerified = true;
	entry.discordId = msg.author.id;
	entry.roles.push(ROLES.VERIFIED);

	bot.mongo.collection(DB.USERS).updateOne(
		{ hash: givenHash },
		{ $set: { ...entry } })
		.then(async () => {
			const member = guild.members.cache.get(msg.author.id);
			if (member) {
				entry.roles.forEach(role => member.roles.add(role, `${member.user.username} (${member.id}) just verified.`));
				return msg.reply('I see you\'re already on the server. I\'ve added your roles for this semester.');
			}

			const invite = await guild.systemChannel.createInvite({
				maxAge: 0,
				maxUses: 1,
				unique: true,
				reason: `[no log] ${msg.author.username} (${msg.author.id}) verified.`
			});

			return msg.reply(`Thank you for verifying! You can now join the server.\n${invite.url}`);
		});
}

async function register(bot: Client): Promise<void> {
	const guild = await bot.guilds.fetch(GUILDS.MAIN);
	guild.members.fetch();

	const errLog = await bot.channels.fetch(LOG.ERROR) as TextChannel;

	bot.on('message', async msg => {
		verify(msg, bot, guild)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});
}

export default register;
