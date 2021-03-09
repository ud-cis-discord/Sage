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
		.sort((ua, ub) => ua.level - ub.level !== 0 ? ua.level > ub.level ? -1 : 1 : ua.curExp < ub.curExp ? -1 : 1); // filter on level first, then remaining xp

	page = page * 10 > users.length ? Math.floor(users.length / 10) + 1 : page;
	const start = (page * 10) - 10;
	const end = page * 10 > users.length ? undefined : page * 10;

	const displUsers = users.slice(start, end);

	const dbAuthor = users.find(user => msg.author.id === user.discordId);

	let content = '';
	displUsers.forEach(user => {
		const rank = displUsers.indexOf(user) + 1 + ((page - 1) * 10);
		const name = msg.guild.members.cache.get(user.discordId).displayName;
		const { level } = user;
		const exp = user.levelExp - user.curExp;
		content += `**${rank}:** ${user === dbAuthor ? `**${name}**` : name} - Level ${level}, ${exp} exp\n`;
	});

	if (!displUsers.find(user => user.discordId === msg.author.id)) {
		const rank = users.indexOf(dbAuthor) + 1;
		const name = msg.member.displayName;
		const { level } = dbAuthor;
		const exp = dbAuthor.levelExp - dbAuthor.curExp;
		content = rank - 1 < start
			? `**${rank}:** ${name} - Level ${level}, ${exp} exp \n\n${content}` : `${content}\n**${rank}:** ${name} - Level ${level}, ${exp} exp\n`;
	}

	const embed = new MessageEmbed()
		.setTitle('UD CIS Discord Leaderboard')
		.setFooter(`Showing page ${page} (${start + 1} - ${end || users.length})`)
		.setColor(msg.guild.members.cache.get(displUsers[0].discordId).displayHexColor)
		.setDescription(content);

	return msg.channel.send(embed);
}

export function argParser(msg: Message, input: string): Array<number | null> {
	const page = parseInt(input) || 1;

	if (page < 1) throw 'Enter a number greater than 1';

	return page ? [page] : [null];
}
