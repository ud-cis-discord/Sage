import { Message, MessageEmbed } from 'discord.js';
import moment from 'moment';
import fetch from 'node-fetch';

export const description = 'Find a comic from xkcd.';
export const usage = '[latest | comicNumber]';
export const extendedHelp = 'If given no paramaters, sends a random comic. You can also specify a comic by its number or get the latest comic with `latest`.';
export const aliases = ['x'];

export async function run(msg: Message, [comicId]: [number | 'latest' | 'random']): Promise<Message> {
	const latest: XkcdComic = await await fetch('http://xkcd.com/info.0.json').then(r => r.json());

	let comic: XkcdComic;

	if (comicId === 'latest') {
		comic = latest;
	} else if (comicId === 'random') {
		comic = await fetch(`http://xkcd.com/${Math.trunc((Math.random() * (latest.num - 1)) + 1)}/info.0.json`).then(r => r.json());
	} else {
		if (comicId < 1 || comicId > latest.num) {
			return msg.channel.send(`Comic ${comicId} does not exists.`);
		}
		comic = await fetch(`http://xkcd.com/${comicId}/info.0.json`).then(r => r.json());
	}

	return msg.channel.send(createComicEmbed(comic));
}

export function argParser(_msg: Message, input: string): Array<string | number> {
	if (!input) {
		return ['random'];
	}

	if (input.toLowerCase() === 'latest') {
		return [input.toLowerCase()];
	}

	if (isNaN(parseInt(input))) {
		throw `Usage: ${usage}`;
	}

	return [parseInt(input)];
}

function createComicEmbed(comic: XkcdComic): MessageEmbed {
	const comicDdescription = (comic.transcript || comic.alt)
		.replace(/{{/g, '{')
		.replace(/}}/g, '}')
		.replace(/\[\[/g, '[')
		.replace(/]]/g, ']')
		.replace(/<</g, '<')
		.replace(/>>/g, '>');
	return new MessageEmbed()
		.setColor('GREYPLE')
		.setDescription(`[View on xkcd.com](https://xkcd.com/${comic.num}/)`)
		.setFooter(comicDdescription)
		.setImage(comic.img)
		.setTimestamp()
		.setTitle(`${comic.safe_title} (#${comic.num}, ${moment(new Date(Number(comic.year), Number(comic.month) - 1, Number(comic.day))).format('YYYY MMMM Do')})`);
}

interface XkcdComic {
	alt: string;
	day: string;
	img: string;
	link: string;
	month: string;
	news: string;
	num: number;
	safe_title: string;		// eslint-disable-line camelcase
	title: string;
	transcript: string;
	year: string;
}
