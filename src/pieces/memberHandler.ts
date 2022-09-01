import { Client, GuildMember, PartialGuildMember } from 'discord.js';
import { SageUser } from '@lib/types/SageUser';
import { DatabaseError } from '@lib/types/errors';
import { DB, FIRST_LEVEL, GUILDS, ROLES } from '@root/config';

async function memberAdd(member: GuildMember): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN) return;
	member.guild.roles.fetch();

	const entry: SageUser = await member.client.mongo.collection(DB.USERS).findOne({ discordId: member.id });

	// commented codeblock depreciated due to verification revamp, saved for future modification
	// 	if (!entry) {
	// 		await member.send(`We couldn't find you in our database, you likely used the invite link with a different account than the one you verified with.
	// Please join the server with the account you used to send your hash, or contact ${MAINTAINERS} if you think this is an error.`);
	// 		await member.kick('This person wasn\'t in the database, they probably used a different account to verify than they used the invite with');
	// 		throw new DatabaseError(`User ${member.user.tag} (${member.id}) does not exist in the database.`);
	// 	}
	// 	if (!entry.isVerified) {
	// 		throw new Error(`User ${member.user.tag} (${member.id}) is not verified.`);
	// 	}

	entry.roles.forEach(role => {
		// This might happen if a course was removed between when they left and when they re-joined.
		if (!member.guild.roles.cache.has(role)) return;

		member.roles.add(role, 'Automatically assigned by Role Handler on join.')
			.catch(async error => member.client.emit('error', error));
	});
}

async function memberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Promise<void> {
	if (newMember.roles.cache.size === oldMember.roles.cache.size || newMember.guild.id !== GUILDS.MAIN) return;

	const updated = await newMember.client.mongo.collection(DB.USERS).updateOne({ discordId: newMember.id }, {
		$set: {
			roles: [...newMember.roles.cache.keys()].filter(role => role !== GUILDS.MAIN)
		}
	});

	if (updated.matchedCount !== 1) {
		throw new DatabaseError(`User ${newMember.user.tag} (${newMember.id}) does not exist in the database.`);
	}
}

async function memberRemove(member: GuildMember | PartialGuildMember): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN) return;
	await member.guild.roles.fetch();

	let dbMember: SageUser = await member.client.mongo.collection(DB.USERS).findOne({ discordId: member.id });

	if (!dbMember) return;

	dbMember = {
		...dbMember,
		isVerified: false,
		discordId: '',
		roles: dbMember.roles.filter(role => {
			const levelRole = member.guild.roles.cache.find(guildRole => guildRole.name.toLowerCase() === `level ${dbMember.level}`);
			console.log(levelRole.id);
			return role !== ROLES.VERIFIED
				&& role !== ROLES.STAFF
				&& role !== levelRole.id;
		}),
		isStaff: false,
		level: 1,
		curExp: FIRST_LEVEL,
		levelExp: FIRST_LEVEL,
		count: 0
	};
	dbMember.roles.push(ROLES.LEVEL_ONE);

	await member.client.mongo.collection(DB.USERS).replaceOne({ discordId: member.id }, dbMember);
}

async function register(bot: Client): Promise<void> {
	bot.on('guildMemberAdd', member => {
		memberAdd(member)
			.catch(async error => bot.emit('error', error));
	});
	bot.on('guildMemberUpdate', async (oldMember, newMember) => {
		memberUpdate(oldMember, newMember)
			.catch(async error => bot.emit('error', error));
	});
	bot.on('guildMemberRemove', async (member) => {
		memberRemove(member);
	});
}

export default register;
