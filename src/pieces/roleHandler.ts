import { GuildMember } from 'discord.js';
import { SageClient } from '@lib/types/SageClient';
import { GUILDS } from '@root/config';
import { SageUser } from '@lib/types/SageUser';

async function memberAdd(member: GuildMember): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN) return;

	const bot = member.client as SageClient;
	const entry: SageUser = await bot.mongo.collection('users').findOne({ discordId: member.id });

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

function register(bot: SageClient): void {
	bot.on('guildMemberAdd', memberAdd);
	bot.on('guildMemberUpdate', memberUpdate);
}

export default register;
