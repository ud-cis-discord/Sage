import { DB, FIRST_LEVEL, ROLES } from '@root/config';
import { botMasterPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { Message } from 'discord.js';

export default class extends Command {

	description = 'Resets every user in the guild\'s level to 1';

	enabled = false;

	permissions(msg: Message): Promise<boolean> {
		return botMasterPerms(msg);
	}

	async run(msg: Message): Promise<Message> {
		const lvl1 = msg.guild.roles.cache.find(role => role.id === ROLES.LEVEL_ONE);

		await msg.guild.members.fetch();
		msg.guild.members.cache.forEach(member => {
			if (member.user.bot) return;

			member.roles.cache.forEach(role => {
				if (role.name.startsWith('Level') && role !== lvl1) {
					member.roles.remove(role.id);
				}
			});
			if (!member.roles.cache.has(ROLES.LEVEL_ONE)) {
				member.roles.add(ROLES.LEVEL_ONE);
			}
		});

		msg.client.mongo.collection(DB.USERS).updateMany({}, { $set: {
			count: 0,
			levelExp: 0,
			level: 0,
			curExp: FIRST_LEVEL
		} });

		return msg.reply('I\'ve reset all levels in the guild.');
	}

}
