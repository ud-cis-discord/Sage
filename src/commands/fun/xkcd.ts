import { ApplicationCommandOptionData, ButtonInteraction, CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import moment from 'moment';
import fetch from 'node-fetch';
import { Command } from '@lib/types/Command';
import { generateErrorEmbed } from '@root/src/lib/utils';

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

	async run(interaction: CommandInteraction): Promise<void> {
		const latest: XkcdComic = await await fetch('http://xkcd.com/info.0.json').then(r => r.json());
		const comicChoice = interaction.options.getString('comic');

		let comic: XkcdComic;

		const prevButton = new MessageButton({ label: 'Previous Comic', customId: 'previous', style: 'SECONDARY', emoji: '◀' });
		const randButton = new MessageButton({ label: 'Random', customId: 'rand', style: 'SECONDARY', emoji: '🔀' });
		const nextButton = new MessageButton({ label: 'Next Comic', customId: 'next', style: 'SECONDARY', emoji: '▶' });
		let comicNum = 0;

		if (comicChoice.toLowerCase() === 'random') {
			comicNum = Math.trunc((Math.random() * (latest.num - 1)) + 1);
			comic = await fetch(`http://xkcd.com/${comicNum}/info.0.json`).then(r => r.json());
		} else if (comicChoice.toLowerCase() === 'latest') {
			comicNum = latest.num;
			comic = latest;
		} else if (!isNaN(Number(comicChoice))) {
			if (Number(comicChoice) < 1 || Number(comicChoice) > latest.num || !Number.isInteger(Number(comicChoice))) {
				return interaction.reply({
					ephemeral: true,
					embeds: [generateErrorEmbed(`Comic ${comicChoice} does not exist.`)]
				});
			}
			comicNum = Number(comicChoice);
			comic = await fetch(`http://xkcd.com/${comicChoice}/info.0.json`).then(r => r.json());
		} else {
			return interaction.reply({
				ephemeral: true,
				embeds: [generateErrorEmbed(`Unknown parameter supplied. Please enter 'latest', 'random', or a number.`)]
			});
		}

		let actionRow;
		if (comicNum === 1) {
			actionRow = new MessageActionRow({ components: [randButton, nextButton] });
		} else if (comicNum === latest.num) {
			actionRow = new MessageActionRow({ components: [prevButton, randButton] });
		} else {
			actionRow = new MessageActionRow({ components: [prevButton, randButton, nextButton] });
		}
		interaction.reply({
			embeds: [this.createComicEmbed(comic)],
			components: [actionRow]
		});

		let replyId;
		interaction.fetchReply().then(reply => { replyId = reply.id; });

		const collector = interaction.channel.createMessageComponentCollector({
			filter: i => i.message.id === replyId
		});

		collector.on('collect', async (i: ButtonInteraction) => {
			i.deferUpdate();
			if (i.customId === 'previous') {
				if (comicNum - 1 > 0) {
					comic = await fetch(`http://xkcd.com/${--comicNum}/info.0.json`).then(r => r.json());
					actionRow = comicNum === 1
						? new MessageActionRow({ components: [randButton, nextButton] })
						: new MessageActionRow({ components: [prevButton, randButton, nextButton] });
				}
			} else if (i.customId === 'next') {
				if (comicNum + 1 <= latest.num) {
					comic = await fetch(`http://xkcd.com/${++comicNum}/info.0.json`).then(r => r.json());
					actionRow = comicNum === latest.num
						? new MessageActionRow({ components: [prevButton, randButton] })
						: new MessageActionRow({ components: [prevButton, randButton, nextButton] });
				}
			} else if (i.customId === 'rand') {
				comicNum = Math.trunc((Math.random() * (latest.num - 1)) + 1);
				comic = await fetch(`http://xkcd.com/${comicNum}/info.0.json`).then(r => r.json());
				if (comicNum === 1) {
					actionRow = new MessageActionRow({ components: [randButton, nextButton] });
				} else if (comicNum === latest.num) {
					actionRow = new MessageActionRow({ components: [prevButton, randButton] });
				} else {
					actionRow = new MessageActionRow({ components: [prevButton, randButton, nextButton] });
				}
			}
			interaction.editReply({
				embeds: [this.createComicEmbed(comic)],
				components: [actionRow]
			});
		});
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
