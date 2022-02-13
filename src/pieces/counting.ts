import { Client, TextChannel } from 'discord.js';
import { CHANNELS } from '@root/config';

async function register(bot: Client): Promise<void> {
	let counter = 0;
	let lastSendId = '';
	let startDate = Date.now();
	const countingChannel = bot.channels.cache.get(CHANNELS.COUNTING_CHANNEL) as TextChannel;

	bot.on('messageDelete', async msg => {
		countingChannel.send(`${msg.partial ? 'Someone' : msg.author.username} deleted a message and broke the count!`);

		if (counter > 0) {
			counter = 0;
			lastSendId = '';
			countingChannel.send('Restarting the counter...\n\n0');
		}
	});

	bot.on('messageCreate', async msg => {
		if (msg.author.bot) return;

		if (msg.channel.id === CHANNELS.COUNTING_CHANNEL) {
			let gameOver = false;

			if (msg.author.id === lastSendId) {
				gameOver = true;
				msg.reply(`${msg.author.username}, you aren't allowed to count twice in a row!`);
			}

			lastSendId = msg.author.id;

			if (Number.isNaN(parseInt(msg.content))) {
				gameOver = true;
				msg.reply(`Really ${msg.author.username}? **${msg.content}** isn't a number!`);
			} else if (parseInt(msg.content) > counter + 1) {
				gameOver = true;
				msg.reply(`Come on ${msg.author.username}, **${msg.content}** doesn't come after **${counter}**!`);
			} else if (parseInt(msg.content) < counter) {
				gameOver = true;
				msg.reply(`Believe it or not ${msg.author.username}, **${msg.content}** is less than **${counter}**.`);
			} else if (msg.attachments.size > 0) {
				gameOver = true;
				msg.reply(`${msg.author.username}, you can't send attachments here. This is a counting channel.`);
			} else if (msg.stickers.size > 0) {
				gameOver = true;
				msg.reply(`${msg.author.username}, that's a nice sticker mate but we're supposed to be counting here.`);
			}

			if (msg.content === (counter + 1).toString()) {
				counter++;
				if (counter === 69 || counter === 420) {
					msg.reply('nice');
				}
			}

			if (gameOver) {
				const endDate = Date.now();
				countingChannel.send(`The count lasted for ${msToHMS(endDate - startDate)}`);

				counter = 0;
				lastSendId = '';
				startDate = endDate;
				countingChannel.send('Restarting the counter...\n\n0');
			}
		}
	});
}

function msToHMS(ms: number) {
	let seconds = ms / 1000;
	const days = seconds / 86400;
	const hours = seconds / 3600;
	seconds %= 3600;
	const minutes = seconds / 60;
	seconds %= 60;

	let returnString = `${Math.floor(seconds)} seconds`;
	if (minutes >= 1) {
		returnString = `${Math.floor(minutes)} minutes, ${returnString}`;
	}
	if (hours >= 1) {
		returnString = `${Math.floor(hours)} hours, ${returnString}`;
	}
	if (days >= 1) {
		returnString = `${Math.floor(days)} days, ${returnString}`;
	}

	return returnString;
}

export default register;

/*
TO DO:
- display average time between counts
- track participants of counting session
- convert final messages to embeds
- save the counting data to config in case bot dies
- stats for counting?
	most counts
	least counts
*/
