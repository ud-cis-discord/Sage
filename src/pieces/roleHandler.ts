import { Client, GuildMember } from 'discord.js';
import { GUILDS } from '@root/config';
import { SageUser } from '@lib/types/SageUser';

async function memberAdd(member: GuildMember): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN) return;

	const entry: SageUser = await member.client.mongo.collection('users').findOne({ discordId: member.id });

	if (!entry) {
		throw `User ${member.id} does not exist in the database.`;
	}
	if (!entry.isVerified) {
		throw `User ${member.id} is not verified.`;
	}

	entry.roles.forEach(role => {
		member.roles.add(role);
	});
}

async function memberUpdate(oldMember: GuildMember, newMember: GuildMember): Promise<void> {
	if (newMember.roles.cache.size === oldMember.roles.cache.size) return;

	newMember.client.mongo.collection('users').updateOne({ discordId: newMember.id }, {
		$set: {
			roles: newMember.roles.cache.keyArray().filter(role => role !== GUILDS.MAIN)
		}
	}).then(updated => {
		if (updated.modifiedCount !== 1) {
			throw `User ${newMember.id} does not exist in the database.`;
		}
	});
}

function register(bot: Client): void {
	bot.on('guildMemberAdd', memberAdd);
	bot.on('guildMemberUpdate', memberUpdate);
}

export default register;
