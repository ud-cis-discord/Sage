import { ApplicationCommandOptionData, CommandInteraction, MessageEmbed, MessageAttachment } from 'discord.js';
import fetch from 'node-fetch';
import { createCanvas, loadImage } from 'canvas';
import { Command } from '@lib/types/Command';
import { generateErrorEmbed } from '@lib/utils';

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

	async run(interaction: CommandInteraction): Promise<unknown> {
		// Might take a few seconds to respond in rare cases
		await interaction.deferReply();

		const tex = encodeURIComponent(interaction.options.getString('input'));
		const errorResponse = "Sorry, I couldn't render that LaTeX expression.";
		let usingBackup = false;
		let image;
		try {
			const response = await fetch(`https://latex.codecogs.com/svg.json?${tex}`, { method: 'Get' });
			if (response.ok) {
				const imageAsBase64JSON = await response.json();
				image = await loadImage(Buffer.from(imageAsBase64JSON.latex.base64, 'base64'));
			} else {
				usingBackup = true;
				const backupResponse = await fetch(`http://chart.apis.google.com/chart?cht=tx&chl=${tex}`, { method: 'Get' });
				if (!backupResponse.ok) {
					// Both of these breaking is very unlikely
					throw new Error(errorResponse);
				}
				image = await loadImage(await backupResponse.buffer(), 'png');
			}
		} catch (error) {
			return interaction.followUp({ embeds: [generateErrorEmbed(errorResponse)] });
		}

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

			for (let i = 0; i < canvasData.data.length; i += 4) {
				if (usingBackup && canvasData.data[i] > 0xE8 && canvasData.data[i + 1] > 0xE8 && canvasData.data[i + 2] > 0xE8) {
					canvasData.data[i] = 47;
					canvasData.data[i + 1] = 49;
					canvasData.data[i + 2] = 54;
				} else {
					canvasData.data[i] = 0xFF - canvasData.data[i];
					canvasData.data[i + 1] = 0xFF - canvasData.data[i + 1];
					canvasData.data[i + 2] = 0xFF - canvasData.data[i + 2];
				}
			}

			ctx.putImageData(canvasData, 0, 0);
		} catch (error) {
			return interaction.followUp({ embeds: [generateErrorEmbed(errorResponse)] });
		}

		const file = new MessageAttachment(canvas.toBuffer(), 'tex.png');
		const embed = new MessageEmbed().setImage('attachment://tex.png');

		interaction.editReply({ embeds: [embed], files: [file] });
	}

}
