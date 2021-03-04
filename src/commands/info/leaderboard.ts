import { SageUser } from '@lib/types/SageUser';
import { MessageEmbed, Message } from 'discord.js';

export const description = 'Gives the top 10 users in the guild';
export const usage = '[page number]';
export const extendedHelp = 'Enter a page number to look further down the leaderboard';
export const runInDM = false;
export const aliases = ['rank', 'leader'];

export async function run(msg: Message, [page]: [number]): Promise<Message> {
	msg.guild.members.fetch();

	const users: Array<SageUser> = (await msg.client.mongo.collection('users').find().toArray() as Array<SageUser>)
		.sort((ua, ub) => ua.level - ub.level !== 0 ? ua.level - ub.level : ua.curExp - ub.curExp); // filter on level first, then remaining xp

	page = page || 1;

	const displUsers = users.slice((page * 10) - 10, page * 10);

	const embed = new MessageEmbed()
		.setAuthor('UD CIS Discord Leaderboard')
		.setTitle(`Showing`)
		.setColor('green')
		.addFields([
			{ name: 'Rank', value: Array.from([...Array(10).keys()]).map(ind => ind * page), inline: true },
			{ name: 'User', value: displUsers.map(user => msg.guild.members.cache.get(user.discordId).displayName).join(' '), inline: true },
			{ name: 'Level', value: displUsers.map(user => user.level) },
			{ name: 'Exp', value: displUsers.map(user => user.levelExp - user.curExp), inline: true }
		]);

	return msg.channel.send(embed);
}

export function argParser(msg: Message, input: string): Array<number | null> {
	const page = parseInt(input);

	if (page < 1) throw 'Enter a number greater than 1';

	return page ? [page] : [null];
}
