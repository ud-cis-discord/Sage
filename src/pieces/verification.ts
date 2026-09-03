import { Client, Guild, ModalSubmitInteraction } from 'discord.js';
import { SageUser } from '@lib/types/SageUser';
import { DB, GUILDS, ROLES } from '@root/config';

// 'verified': first successful verification, roles granted
// 'reverified': this account already owned the hash; roles were re-applied
// 'claimedByOther': the hash is already bound to a different Discord account
// 'notInGuild': the submitter is not a member of the main guild
// 'roleAddFailed': the DB was updated but Discord refused the role grant (error already emitted)
export type VerifyResult = 'verified' | 'reverified' | 'claimedByOther' | 'notInGuild' | 'roleAddFailed';

export async function verify(interaction: ModalSubmitInteraction, bot: Client, guild: Guild, entry: SageUser, givenHash: string): Promise<VerifyResult> {
	const users = bot.mongo.collection(DB.USERS);
	const userId = interaction.user.id;

	if (entry.isVerified && entry.discordId && entry.discordId !== userId) return 'claimedByOther';

	const member = await guild.members.fetch(userId).catch(() => null);
	if (!member) return 'notInGuild';

	// only a record already bound to this exact account is a re-verification; anything unbound must go through the claim below
	let wasVerified = entry.isVerified && entry.discordId === userId;
	if (!wasVerified) {
		// targeted, atomic claim of an unverified (or verified-but-unbound) record: if two submissions race, exactly one matches
		const updated = await users.updateOne(
			{ hash: givenHash, $or: [{ isVerified: false }, { discordId: { $in: ['', null] } }] },
			{ $set: { isVerified: true, discordId: userId }, $addToSet: { roles: ROLES.VERIFIED } });
		if (updated.matchedCount !== 1) {
			const current: SageUser = await users.findOne({ hash: givenHash });
			if (!current || current.discordId !== userId) return 'claimedByOther';
			wasVerified = true;
		}
	}

	// skip role IDs that no longer exist (e.g. a removed course) so one stale ID can't fail the whole grant
	const roles = [...new Set([...entry.roles, ROLES.VERIFIED])].filter(role => guild.roles.cache.has(role));
	try {
		await member.roles.add(roles, `${member.user.username} (${member.id}) just verified.`);
	} catch (error) {
		bot.emit('error', error);
		return 'roleAddFailed';
	}

	return wasVerified ? 'reverified' : 'verified';
}

async function register(bot: Client): Promise<void> {
	const guild = await bot.guilds.fetch(GUILDS.MAIN);
	guild.members.fetch();
}

export default register;
