import { Command } from '@lib/types/Command';
import { DB, ROLES } from '@root/config';
import { adminPerms } from '@root/src/lib/permissions';
import { SageUser } from '@root/src/lib/types/SageUser';
import { Message } from 'discord.js';


export default class extends Command {

	description = 'Syncs the server with the current state of the database.'

	permissions(msg: Message): boolean {
		return adminPerms(msg);
	}

	async run(msg: Message): Promise<Message> {
		await msg.guild.members.fetch();

		const dbMembers: SageUser[] = await msg.client.mongo.collection(DB.USERS).find().toArray();

		dbMembers.forEach(async dbUser => {
			if (dbUser.discordId === '') return; // user unverified -- don't do anything
			const discordUser = msg.guild.members.cache.get(dbUser.discordId);

			if (discordUser === undefined) { // user in db but not in guild -- act like they've left
				await msg.client.mongo.collection(DB.USERS).updateOne(
					{ discordId: dbUser.discordId },
					{ $set: {
						discordId: '',
						isVerified: false,
						roles: dbUser.roles.filter(role => role !== ROLES.VERIFIED)
					} }
				);
				return;
			}

			discordUser.roles.set(dbUser.roles, 'Syncing user to database'); // sync roles
		});


		return msg.channel.send('Database and guild synced!');
	}

}
