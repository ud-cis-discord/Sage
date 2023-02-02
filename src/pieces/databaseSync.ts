import { DB, GUILDS, ROLES } from '@root/config';
import { Client } from 'discord.js';
import { SageUser } from '../lib/types/SageUser';
import { schedule } from 'node-cron';

async function register(bot: Client): Promise<void> {
	handleCron(bot);
	schedule('0 3 * * *', () => { // run every day at 3:00am (time chosen because of low activity)
		handleCron(bot)
			.catch(async error => bot.emit('error', error));
	});
}

async function handleCron(bot: Client) {
	const guild = await bot.guilds.fetch(GUILDS.MAIN);
	await guild.members.fetch();
	guild.members.cache.forEach(async (member) => {
		if (member.user.bot || !member.roles.cache.has(ROLES.VERIFIED)) return; // ignore bots/unverified members

		const currentUser = await bot.mongo.collection<SageUser>(DB.USERS).findOne({ discordId: member.user.id });
		if (!currentUser) return; // not in database (for some reason; maybe ID is not linked to a user document)

		const newRoles = [];
		const newCourses = [];

		member.roles.cache.forEach(role => {
			if (role.name !== '@everyone') {
				newRoles.push(role.id);
				if (role.name.match(/CISC .{1,}/g)) { // checks if the role name starts with "CISC " and is followed by one or more additional characters
					newCourses.push(role.name.substring(5));
				}
			}
		});

		await bot.mongo.collection(DB.USERS).updateOne(
			{ discordId: member.id },
			{ $set: { roles: newRoles, courses: newCourses } });
	});
}

export default register;
