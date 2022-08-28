import { Client, Guild, ModalSubmitInteraction } from 'discord.js';
import { SageUser } from '@lib/types/SageUser';
import { DB, GUILDS, ROLES } from '@root/config';

export async function verify(interaction: ModalSubmitInteraction, bot: Client, guild: Guild, entry: SageUser, givenHash: string): Promise<void> {
	if (!entry.isVerified) {
		entry.isVerified = true;
		entry.discordId = interaction.user.id;
		entry.roles.push(ROLES.VERIFIED);

		bot.mongo.collection(DB.USERS).updateOne(
			{ hash: givenHash },
			{ $set: { ...entry } })
			.then(async () => {
				const member = guild.members.cache.get(interaction.user.id);
				if (member) {
					entry.roles.forEach(role => member.roles.add(role, `${member.user.username} (${member.id}) just verified.`));
					return;
				} return;
			});
	}
}

async function register(bot: Client): Promise<void> {
	const guild = await bot.guilds.fetch(GUILDS.MAIN);
	guild.members.fetch();
}

export default register;

