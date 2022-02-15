import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { DB, CHANNELS } from '@root/config';
import { Counter } from '../lib/types/Counter';

let countingDB: Counter;
let countingChannel;

async function register(bot: Client): Promise<void> {
	countingDB = await bot.mongo.collection(DB.COUNTING).findOne({ piece: 'counting' });
	countingChannel = bot.channels.cache.get(CHANNELS.COUNTING_CHANNEL) as TextChannel;

	bot.on('messageUpdate', async msg => {
		if (msg.channel.id !== CHANNELS.COUNTING_CHANNEL) return;
		if (msg.author.bot && !msg.partial) return; // sage will crash if it hits this line and the message is a partial
		if (msg.createdTimestamp <= countingDB.startDate) return;

		const endMsg = (`${msg.partial ? 'Someone' : msg.author.username} edited a message and broke the count!`);

		if (countingDB.count > 0) {
			await endGame(endMsg, bot);
		}
	});

	bot.on('messageDelete', async msg => {
		if (msg.channel.id !== CHANNELS.COUNTING_CHANNEL) return;
		if (msg.author.bot && !msg.partial) return; // sage will crash if it hits this line and the message is a partial
		if (msg.createdTimestamp <= countingDB.startDate) return;

		const endMsg = (`${msg.partial ? 'Someone' : msg.author.username} deleted a message and broke the count!`);

		if (countingDB.count > 0) {
			await endGame(endMsg, bot);
		}
	});

	bot.on('messageCreate', async msg => {
		if (msg.author.bot) return;

		if (msg.channel.id === CHANNELS.COUNTING_CHANNEL) {
			let gameOver = false;

			if (msg.author.id === countingDB.lastSendId) {
				gameOver = true;
				msg.reply(`${msg.author.username}, you aren't allowed to count twice in a row!`);
			}

			countingDB.lastSendId = msg.author.id;

			let endMsg = '';
			if (msg.stickers.size > 0) {
				gameOver = true;
				endMsg = (`${msg.author.username}, that's a nice sticker mate but we're supposed to be counting here.`);
			} else if (msg.attachments.size > 0) {
				gameOver = true;
				endMsg = (`${msg.author.username}, you can't send attachments here. This is a counting channel.`);
			} else if (Number.isNaN(parseInt(msg.content))) {
				gameOver = true;
				endMsg = (`Really ${msg.author.username}? ${msg.content} isn't a number!`);
			} else if (parseInt(msg.content) > countingDB.count + 1) {
				gameOver = true;
				endMsg = (`Come on ${msg.author.username}, ${msg.content} doesn't come after **${countingDB.count}**!`);
			} else if (parseInt(msg.content) < countingDB.count) {
				gameOver = true;
				endMsg = (`Believe it or not ${msg.author.username}, ${msg.content} is less than **${countingDB.count}**.`);
			} else if (parseInt(msg.content) === countingDB.count) {
				gameOver = true;
				endMsg = (`My dude that is literally the number we were on.`);
			}

			if (msg.content === (countingDB.count + 1).toString()) {
				if (!countingDB.uniqueParticipants.includes(msg.author.id)) {
					await bot.mongo.collection(DB.COUNTING).findOneAndUpdate({ piece: 'counting' }, { $push: { uniqueParticipants: msg.author.id } });
				}

				await bot.mongo.collection(DB.COUNTING).findOneAndUpdate({ piece: 'counting' }, { $inc: { count: +1 } });
				await bot.mongo.collection(DB.COUNTING).findOneAndUpdate({ piece: 'counting' }, { $set: { lastSendId: msg.author.id } });
				countingDB = await bot.mongo.collection(DB.COUNTING).findOne({ piece: 'counting' }); // update the counter data

				if (countingDB.count === 69 || countingDB.count === 420) {
					msg.reply('nice');
				}
			}

			if (gameOver) {
				await endGame(endMsg, bot);
			}
		}
	});
}

async function endGame(message: string, bot: Client) {
	const endDate = Date.now();
	const resultEmbed = new MessageEmbed()
		.setTitle(message)
		.setDescription(`The count lasted for **${msToHMS(endDate - countingDB.startDate)}**. With **${countingDB.count}** counts and **${countingDB.uniqueParticipants.length}** participants ` +
		`that's an average of one count every **${msToHMS((endDate - countingDB.startDate) / countingDB.count)}**`)
		.setColor('BLURPLE'); // haha nice one discord
	countingChannel.send({ embeds: [resultEmbed] });

	await bot.mongo.collection(DB.COUNTING).findOneAndUpdate({ piece: 'counting' }, { $set: { count: 0, lastSendId: '', startDate: endDate, uniqueParticipants: [] } });
	countingChannel.send('Restarting the counter...\n\n0');
	countingDB = await bot.mongo.collection(DB.COUNTING).findOne({ piece: 'counting' }); // update the counter data
}

function msToHMS(ms: number) {
	let seconds = ms / 1000;
	const days = seconds / 86400;
	const hours = seconds / 3600;
	seconds %= 3600;
	const minutes = seconds / 60;
	seconds %= 60;

	let returnString = `${Math.round(seconds * 10) / 10} seconds`;
	if (minutes >= 1) {
		returnString = `${Math.floor(minutes)} minute${Math.floor(minutes) === 1 ? '' : 's'}, ${returnString}`;
	}
	if (hours >= 1) {
		returnString = `${Math.floor(hours)} hour${Math.floor(hours) === 1 ? '' : 's'}, ${returnString}`;
	}
	if (days >= 1) {
		returnString = `${Math.floor(days)} day${Math.floor(days) === 1 ? '' : 's'}, ${returnString}`;
	}

	return returnString;
}

export default register;
