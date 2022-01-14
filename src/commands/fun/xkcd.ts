import { ApplicationCommandOptionData, CommandInteraction, Message, MessageEmbed } from 'discord.js';
import moment from 'moment';
import fetch from 'node-fetch';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Find a comic from xkcd.';
	options: ApplicationCommandOptionData[] = [
		{
			name: 'comic',
			description: `The comic to send. Can be 'latest', 'random', or a number.`,
			type: 'STRING',
			required: true
		}
	]

	run(_msg: Message): Promise<void> { return; }

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const latest: XkcdComic = await await fetch('http://xkcd.com/info.0.json').then(r => r.json());
		const comicChoice = interaction.options.getString('comic');

		let comic: XkcdComic;

		if (comicChoice.toLowerCase() === 'random') {
			comic = await fetch(`http://xkcd.com/${Math.trunc((Math.random() * (latest.num - 1)) + 1)}/info.0.json`).then(r => r.json());
		} else if (comicChoice.toLowerCase() === 'latest') {
			comic = latest;
		} else if (!isNaN(Number(comicChoice))) {
			let errorEmbed: MessageEmbed;
			if (Number(comicChoice) < 1 || Number(comicChoice) > latest.num || !Number.isInteger(Number(comicChoice))) {
				errorEmbed = new MessageEmbed()
					.setTitle('Error')
					.setDescription(`Comic ${comicChoice} does not exist.`)
					.setColor('RED');
				return interaction.reply({
					ephemeral: true,
					embeds: [errorEmbed]
				});
			}
			comic = await fetch(`http://xkcd.com/${comicChoice}/info.0.json`).then(r => r.json());
		} else {
			const errorEmbed = new MessageEmbed()
				.setTitle('Error')
				.setDescription(`Unknown parameter supplied. Please enter 'latest', 'random', or a number.`)
				.setColor('RED');
			return interaction.reply({
				ephemeral: true,
				embeds: [errorEmbed]
			});
		}
		return interaction.reply({ embeds: [this.createComicEmbed(comic)] });
	}

	createComicEmbed(comic: XkcdComic): MessageEmbed {
		let comicDescription = (comic.alt || comic.transcript)
			.replace(/{{/g, '{')
			.replace(/}}/g, '}')
			.replace(/\[\[/g, '[')
			.replace(/]]/g, ']')
			.replace(/<</g, '<')
			.replace(/>>/g, '>');
		if (comicDescription.length > 2048) {
			comicDescription = `${comicDescription.slice(0, 2000)}...`;
		}

		return new MessageEmbed()
			.setColor('GREYPLE')
			.setDescription(`[View on xkcd.com](https://xkcd.com/${comic.num}/)`)
			.setFooter(comicDescription)
			.setImage(comic.img)
			.setTimestamp()
			.setTitle(`${comic.safe_title} (#${comic.num}, ${moment(new Date(Number(comic.year), Number(comic.month) - 1, Number(comic.day))).format('YYYY MMMM Do')})`);
	}

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
