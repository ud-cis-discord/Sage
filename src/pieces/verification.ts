import { Client, Message, Guild } from 'discord.js';
import { SageUser } from '@lib/types/SageUser';
import { DB, GUILDS, MAINTAINERS, PREFIX, ROLES } from '@root/config';

async function verify(msg: Message, bot: Client, guild: Guild) {
	if (msg.channel.type !== 'DM' || msg.content.trim().length !== 44 || msg.content.includes(' ')) return;

	const givenHash = msg.content.trim();

	const entry: SageUser = await bot.mongo.collection(DB.USERS).findOne({ hash: givenHash });

	if (!entry) {
		return msg.reply(`I could not find that hash in the database. Please try again or contact ${MAINTAINERS}.`);
	}

	if (!entry.isVerified) {
		entry.isVerified = true;
		entry.discordId = msg.author.id;
		entry.roles.push(ROLES.VERIFIED);

		const enrollStr = entry.courses.length > 0
			? `You have been automatically enrolled in CISC ${entry.courses[0]}. To enroll in more courses or unenroll from your current course,` +
			` send \`${PREFIX}enroll <courseCode>\`.`
			: '';

		bot.mongo.collection(DB.USERS).updateOne(
			{ hash: givenHash },
			{ $set: { ...entry } })
			.then(async () => {
				const member = guild.members.cache.get(msg.author.id);
				if (member) {
					entry.roles.forEach(role => member.roles.add(role, `${member.user.username} (${member.id}) just verified.`));
					return msg.reply(`I see you're already on the server. I've added your roles for this semester.\n${enrollStr}`);
				}

				const invite = await guild.systemChannel.createInvite({
					maxAge: 0,
					maxUses: 1,
					unique: true,
					reason: `[no log] ${msg.author.username} (${msg.author.id}) verified.`
				});

				return msg.reply(`Thank you for verifying! You can now join the server.\n${invite.url}\n\n${enrollStr}`);
			});
	} else {
		const member = guild.members.cache.get(msg.author.id);
		if (member) {
			return msg.reply('It would seem you are already verified and a member of the UD CIS Discord server. ' +
				`Contact ${MAINTAINERS} if you think this is an error.`);
		}

		const invite = await guild.systemChannel.createInvite({
			maxAge: 0,
			maxUses: 1,
			unique: true,
			reason: `[no log] ${msg.author.username} (${msg.author.id}) re-verified.`
		});

		return msg.reply('Thank you for verifying! It looks like you were on the UD CIS Discord server in the past ' +
			`so I'll add you old roles once you rejoin.\n${invite.url}`);
	}
}

async function register(bot: Client): Promise<void> {
	const guild = await bot.guilds.fetch(GUILDS.MAIN);
	guild.members.fetch();

	bot.on('messageCreate', async msg => {
		verify(msg, bot, guild)
			.catch(async error => bot.emit('error', error));
	});
}

export default register;
