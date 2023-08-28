import { SageUser } from '@lib/types/SageUser';
import { Leaderboard } from '@lib/enums';
import { Command } from '@lib/types/Command';
import { createCanvas, CanvasRenderingContext2D, loadImage } from 'canvas';
import { EmbedBuilder, ApplicationCommandOptionData, ChatInputCommandInteraction, ApplicationCommandOptionType, InteractionResponse, ImageURLOptions } from 'discord.js';

export default class extends Command {

	description = 'Gives the top 10 users in the guild';
	extendedHelp = 'Enter a page number to look further down the leaderboard';
	runInDM = false;

	options: ApplicationCommandOptionData[] = [
		{
			name: 'pagenumber',
			description: 'leaderboard page to view',
			type: ApplicationCommandOptionType.Number,
			required: false
		}
	]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		await interaction.deferReply();
		await interaction.guild.members.fetch();

		// eslint-disable-next-line no-extra-parens
		const users: Array<SageUser> = (await interaction.client.mongo.collection('users').find().toArray() as Array<SageUser>)
			.filter(user => interaction.guild.members.cache.has(user.discordId))
			.sort((ua, ub) => ua.level - ub.level !== 0 ? ua.level > ub.level ? -1 : 1 : ua.curExp < ub.curExp ? -1 : 1); // filter on level first, then remaining xp

		const dbAuthor = users.find(user => interaction.user.id === user.discordId);
		const askerRank = users.indexOf(dbAuthor) + 1;

		let page = interaction.options.getNumber('pagenumber') ?? Math.floor((askerRank - 1) / 10) + 1;

		page = page * 10 > users.length ? Math.floor(users.length / 10) + 1 : page;

		const start = (page * 10) - 10;
		const end = page * 10 > users.length ? undefined : page * 10;

		const displUsers = users.slice(start, end);

		const canvas = createCanvas(Leaderboard.width, (Leaderboard.userPillHeight + 5) * displUsers.length);
		const ctx = canvas.getContext('2d');

		for (const user of displUsers) {
			const i = displUsers.indexOf(user);
			const discUser = interaction.guild.members.cache.get(user.discordId);
			const rank = i + 1 + ((page - 1) * 10);
			const { level } = user;
			const exp = user.levelExp - user.curExp;

			const cursor = { x: 0, y: i * (Leaderboard.userPillHeight + Leaderboard.margin) };

			ctx.fillStyle = Leaderboard.userPillColor;
			this.roundedRect(ctx, cursor.x, cursor.y, Leaderboard.width, Leaderboard.userPillHeight, 10);

			const pfp = await loadImage(discUser.user.displayAvatarURL({ extension: 'png' } as ImageURLOptions));
			ctx.drawImage(pfp, 0, cursor.y, Leaderboard.userPillHeight, Leaderboard.userPillHeight);
			cursor.x += Leaderboard.userPillHeight + 15;
			cursor.y += Leaderboard.userPillHeight / 2;

			ctx.font = Leaderboard.font;
			ctx.textBaseline = 'middle';
			switch (rank) {
				case 1:
					ctx.fillStyle = Leaderboard.firstColor;
					break;
				case 2:
					ctx.fillStyle = Leaderboard.secondColor;
					break;
				case 3:
					ctx.fillStyle = Leaderboard.thirdColor;
					break;
				default:
					ctx.fillStyle = Leaderboard.textColor;
					break;
			}
			ctx.fillText(`#${rank}`, cursor.x, cursor.y);
			cursor.x += 75;

			ctx.fillStyle = Leaderboard.textColor;
			ctx.fillText(discUser.displayName, cursor.x, cursor.y, 325);
			cursor.x = 450;

			ctx.fillStyle = discUser.displayHexColor !== '#000000' ? discUser.displayHexColor : Leaderboard.textColor;
			ctx.fillText(`Level ${level}`, cursor.x, cursor.y);
			cursor.x += 150;

			ctx.fillStyle = Leaderboard.textColor;
			ctx.fillText(`${exp} exp`, cursor.x, cursor.y);
		}
		const { level: askerLevel } = dbAuthor;
		const askerExp = dbAuthor.levelExp - dbAuthor.curExp;
		const content = `You are #${askerRank} and at level ${askerLevel} with ${askerExp} exp.`;


		const embed = new EmbedBuilder()
			.setTitle('UD CIS Discord Leaderboard')
			.setFooter({ text: `Showing page ${page} (${start + 1} - ${end || users.length})` })
			.setColor(interaction.guild.members.cache.get(displUsers[0].discordId).displayHexColor)
			.setDescription(content)
			.setImage('attachment://leaderboard.png');

		interaction.followUp({
			embeds: [embed],
			files: [{ name: 'leaderboard.png', attachment: canvas.toBuffer() }]
		});
		return;
	}

	roundedRect(ctx: CanvasRenderingContext2D, x: number, y: number, width: number, height: number, radius: number): void {
		ctx.beginPath();
		ctx.moveTo(x, y + radius);
		ctx.lineTo(x, y + height - radius);
		ctx.arcTo(x, y + height, x + radius, y + height, radius);
		ctx.lineTo(x + width - radius, y + height);
		ctx.arcTo(x + width, y + height, x + width, y + height - radius, radius);
		ctx.lineTo(x + width, y + radius);
		ctx.arcTo(x + width, y, x + width - radius, y, radius);
		ctx.lineTo(x + radius, y);
		ctx.arcTo(x, y, x, y + radius, radius);
		ctx.fill();
	}

}
