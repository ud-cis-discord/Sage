import { Client, GuildMember, PartialGuildMember, TextChannel } from 'discord.js';
import { logError } from '@lib/utils';
import { SageUser } from '@lib/types/SageUser';
import { DatabaseError } from '@lib/types/errors';
import { DB, GUILDS, LOG } from '@root/config';

async function memberAdd(member: GuildMember): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN) return;

	const entry: SageUser = await member.client.mongo.collection(DB.USERS).findOne({ discordId: member.id });

	if (!entry) {
		throw new DatabaseError(`User ${member.user.tag} (${member.id}) does not exist in the database.`);
	}
	if (!entry.isVerified) {
		throw new Error(`User ${member.user.tag} (${member.id}) is not verified.`);
	}

	entry.roles.forEach(role => {
		member.roles.add(role);
	});
}

async function memberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember): Promise<void> {
	if (newMember.roles.cache.size === oldMember.roles.cache.size) return;
	let error: boolean;

	await newMember.client.mongo.collection(DB.USERS).updateOne({ discordId: newMember.id }, {

		$set: {
			roles: newMember.roles.cache.keyArray().filter(role => role !== GUILDS.MAIN)
		}
	}).then(updated => {
		error = updated.modifiedCount !== 1;
	});

	if (error) {
		throw new DatabaseError(`User ${newMember.user.tag} (${newMember.id}) does not exist in the database.`);
	}
}

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(LOG.ERROR) as TextChannel;
	bot.on('guildMemberAdd', member => {
		memberAdd(member)
			.catch(async error => errLog.send(await logError(error)));
	});
	bot.on('guildMemberUpdate', async (oldMember, newMember) => {
		memberUpdate(oldMember, newMember)
			.catch(async (error: Error) => {
				errLog.send(await logError(error));
			});
	});
}

export default register;
