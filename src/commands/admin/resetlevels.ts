import { DB, FIRST_LEVEL, LEVEL_TIER_ROLES, ROLES } from '@root/config';
import { botMasterPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { Message } from 'discord.js';
import { SageUser } from '@root/src/lib/types/SageUser';

export default class extends Command {

	description = 'Resets every user in the guild\'s level to 1';

	enabled = false;

	permissions(msg: Message): Promise<boolean> {
		return botMasterPerms(msg);
	}

	async run(msg: Message): Promise<Message> {
		const loadingMsg = await msg.channel.send('loading... <a:loading:928003042954059888>');
		await msg.guild.roles.fetch();
		const lvl1 = msg.guild.roles.cache.find(role => role.id === ROLES.LEVEL_ONE);

		await msg.guild.members.fetch();
		msg.guild.members.cache.forEach(member => {
			if (member.user.bot || !member.roles.cache.has(ROLES.VERIFIED)) return;
			let level: number;
			let lvlTier = -1;

			member.roles.cache.forEach(role => {
				if (role.name.startsWith('Level') && role !== lvl1) {
					member.roles.remove(role.id);
					level = Number.parseInt(role.name.split(' ')[1]);
					if (level >= 2) lvlTier = 0;
					if (level >= 5) lvlTier = 1;
					if (level >= 10) lvlTier = 2;
					if (level >= 15) lvlTier = 3;
					if (level >= 20) lvlTier = 4;
					level = 0;
				}
			});

			if (lvlTier !== -1) member.roles.add(LEVEL_TIER_ROLES[lvlTier]);
			lvlTier = -1;

			if (!member.roles.cache.has(ROLES.LEVEL_ONE)) {
				member.roles.add(ROLES.LEVEL_ONE);
			}
		});

		msg.client.mongo.collection<SageUser>(DB.USERS).updateMany(
			{ roles: { $all: [ROLES.VERIFIED] } }, {
				$set: {
					count: 0,
					levelExp: FIRST_LEVEL,
					level: 1,
					curExp: FIRST_LEVEL
				}
			});

		return loadingMsg.edit('I\'ve reset all levels in the guild.');
	}

}
