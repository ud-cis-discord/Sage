import { ApplicationCommandOptionData, CommandInteraction, MessageEmbed, MessageAttachment } from 'discord.js';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';
import { Command } from '@lib/types/Command';

const BACKGROUND_COLOR = `rgb(${255 - 47}, ${255 - 49}, ${255 - 54})`;
const PADDING = 4;

export default class extends Command {

	// Made by Brendan Lewis (@craftablescience)

	description = `Accepts a LaTeX expression and posts it as a rendered image.`;

	options: ApplicationCommandOptionData[] = [
		{
			name: 'input',
			description: 'The LaTeX expression to render',
			type: 'STRING',
			required: true
		}
	]

	async tempRun(interaction: CommandInteraction): Promise<void> {
		// Might take a few seconds to respond in rare cases
		await interaction.deferReply();

		const tex = interaction.options.getString('input');
		const requestURL = `https://latex.codecogs.com/svg.json?${encodeURIComponent(tex)}`;
		const errorResponse = "Sorry, I couldn't render that LaTeX expression.";
		let imageAsBase64: Buffer;
		try {
			const response = await fetch(requestURL, { method: 'Get' });
			const imageAsBase64JSON = await response.json();
			imageAsBase64 = Buffer.from(imageAsBase64JSON.latex.base64, 'base64');
		} catch (error) {
			interaction.editReply({ content: errorResponse });
			throw error;
		}

		const image = await loadImage(imageAsBase64);

		// Image will have 4 pixels of padding on all sides
		const canvasWidth = image.width + (PADDING * 2);
		const canvasHeight = image.height + (PADDING * 2);

		const canvas = createCanvas(canvasWidth, canvasHeight);
		const ctx = canvas.getContext('2d');
		ctx.clearRect(0, 0, canvasWidth, canvasHeight);

		// Invert the default Discord embed background color, entire canvas is inverted later
		ctx.beginPath();
		ctx.fillStyle = BACKGROUND_COLOR;
		ctx.fillRect(0, 0, canvasWidth, canvasHeight);

		// Draw image and invert color - necessary because the text is black and unreadable by default
		ctx.drawImage(image, PADDING, PADDING);
		try {
			const canvasData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);

			// https://stackoverflow.com/a/70097101/7545722
			// no other solution works here? this is a bit slower than the other methods but barely noticeable,
			// especially considering the size of the average image is very small
			// and this keeps transparency
			for (let i = 0; i < canvasData.data.length; i += i % 4 === 2 ? 2 : 1) {
				canvasData.data[i] = 255 - canvasData.data[i];
			}
			ctx.putImageData(canvasData, 0, 0);
		} catch (error) {
			interaction.editReply({ content: errorResponse });
			throw error;
		}

		const file = new MessageAttachment(canvas.toBuffer(), 'tex.png');

		const embed = new MessageEmbed()
			.setImage('attachment://tex.png')
			.setURL(requestURL);

		interaction.editReply({ embeds: [embed], files: [file] });
	}

	async run(): Promise<void> {
		return;
	}

}

