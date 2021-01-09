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

function memberUpdate(_newMember: GuildMember, _oldMember: GuildMember): void {
	return;
}

function register(bot: Client): void {
	bot.on('guildMemberAdd', memberAdd);
	bot.on('guildMemberUpdate', memberUpdate);
}

export default register;
