import { SageUser } from '@lib/types/SageUser';
import { MessageEmbed, Message } from 'discord.js';

export const description = 'Gives the top 10 users in the guild';
export const usage = '[page number]';
export const extendedHelp = 'Enter a page number to look further down the leaderboard';
export const runInDM = false;
export const aliases = ['rank', 'leader'];

export async function run(msg: Message, [page]: [number]): Promise<Message> {
	msg.guild.members.fetch();

	// eslint-disable-next-line no-extra-parens
	const users: Array<SageUser> = (await msg.client.mongo.collection('users').find().toArray() as Array<SageUser>)
		.sort((ua, ub) => ua.level - ub.level !== 0 ? ua.level > ub.level ? -1 : 1 : ua.curExp > ub.curExp ? -1 : 1); // filter on level first, then remaining xp

	const start = (page * 10) - 10;
	const end = page * 10 > users.length ? null : page * 10;
	console.log(users[11].email);

	const displUsers = users.slice(start, end);

	let content = '';
	displUsers.forEach(user => {
		const rank = displUsers.indexOf(user) + 1 + ((page - 1) * 10);
		const name = msg.guild.members.cache.get(user.discordId).displayName;
		const { level } = user;
		const exp = user.levelExp - user.curExp;
		content += `**${rank}:** ${name} - Level ${level}, ${exp}exp\n`;
	});

	const embed = new MessageEmbed()
		.setAuthor('UD CIS Discord Leaderboard')
		.setFooter(`Showing page ${page} (${start + 1} - ${end || users.length})`)
		.setColor('GREEN')
		.setDescription(content);

	return msg.channel.send(embed);
}

export function argParser(msg: Message, input: string): Array<number | null> {
	const page = parseInt(input) || 1;

	if (page < 1) throw 'Enter a number greater than 1';

	return page ? [page] : [null];
}
