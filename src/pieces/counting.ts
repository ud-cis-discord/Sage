import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { DB, CHANNELS } from '@root/config';
import { Counter } from '@lib/types/Counter';
import { msToHMS } from '@lib/utils';

let countingDB: Counter;
let countingChannel;

async function register(bot: Client): Promise<void> {
	countingDB = await bot.mongo.collection(DB.COUNTING).findOne({ piece: 'counting' });
	countingChannel = await bot.channels.fetch(CHANNELS.COUNTING_CHANNEL) as TextChannel;

	bot.on('messageUpdate', async msg => {
		if (msg.channel.id !== CHANNELS.COUNTING_CHANNEL) return;
		if (msg.author.bot && !msg.partial) return; // sage will crash if it hits this line and the message is a partial
		if (msg.createdTimestamp <= countingDB.startDate) return;

		const endMsg = `${msg.partial ? 'Someone' : msg.author.toString()} edited a message and broke the count!`;

		if (countingDB.count > 0) {
			await endGame(endMsg, bot);
		}
	});

	bot.on('messageDelete', async msg => {
		if (msg.channel.id !== CHANNELS.COUNTING_CHANNEL) return;
		if (msg.author.bot && !msg.partial) return; // sage will crash if it hits this line and the message is a partial
		if (msg.createdTimestamp <= countingDB.startDate) return;

		const endMsg = `${msg.partial ? 'Someone' : msg.author.toString()} deleted a message and broke the count!`;

		if (countingDB.count > 0) {
			await endGame(endMsg, bot);
		}
	});

	bot.on('messageCreate', async msg => {
		if (msg.author.bot || msg.channel.id !== CHANNELS.COUNTING_CHANNEL) return;

		let gameOver = false;
		let endMsg = '';

		if (msg.author.id === countingDB.lastSendId) {
			gameOver = true;
			endMsg = `${msg.author.toString()}, you aren't allowed to count twice in a row!`;
		}

		countingDB.lastSendId = msg.author.id;

		if (msg.stickers.size > 0) {
			gameOver = true;
			endMsg = `${msg.author.toString()}, that's a nice sticker mate but we're supposed to be counting here.`;
		} else if (msg.attachments.size > 0) {
			gameOver = true;
			endMsg = `${msg.author.toString()}, you can't send attachments here. This is a counting channel.`;
		} else if (Number.isNaN(parseInt(msg.content))) {
			gameOver = true;
			endMsg = `Really ${msg.author.toString()}? **${msg.content}** isn't a number!`;
		} else if (parseInt(msg.content) > countingDB.count + 1) {
			gameOver = true;
			endMsg = `Come on ${msg.author.toString()}, **${msg.content}** doesn't come after **${countingDB.count}**!`;
		} else if (parseInt(msg.content) < countingDB.count) {
			gameOver = true;
			endMsg = `Believe it or not ${msg.author.toString()}, **${msg.content}** is less than **${countingDB.count}**.`;
		} else if (parseInt(msg.content) === countingDB.count) {
			gameOver = true;
			endMsg = `My dude ${msg.author.toString()}, that was literally the number we were on.`;
		} else if (!/^\d+$/.test(msg.content)) { // thanks Ben!
			gameOver = true;
			endMsg = `${msg.author.toString()}, you've sent more things than just the number.`;
		}

		if (msg.content === (countingDB.count + 1).toString()) {
			if (!countingDB.uniqueParticipants.includes(msg.author.id)) {
				await bot.mongo.collection(DB.COUNTING).findOneAndUpdate({ piece: 'counting' }, { $push: { uniqueParticipants: msg.author.id } });
			}

			await bot.mongo.collection(DB.COUNTING).findOneAndUpdate({ piece: 'counting' }, { $inc: { count: +1 } });
			await bot.mongo.collection(DB.COUNTING).findOneAndUpdate({ piece: 'counting' }, { $set: { lastSendId: msg.author.id } });
			countingDB = await bot.mongo.collection(DB.COUNTING).findOne({ piece: 'counting' }); // update the counter data

			switch (countingDB.count) {
				case 69:
				case 420:
					msg.react('👌');
					break;
				case 100:
					msg.react('💯');
					break;
				case 250:
					msg.react('😮');
					break;
				case 500:
					msg.react('👏');
					break;
				case 1000:
					msg.react('🎉');
					break;
			}
		}

		if (gameOver) {
			await endGame(endMsg, bot);
		}
	});
}

async function endGame(message: string, bot: Client) {
	const endDate = Date.now();
	if (countingDB.count !== 0) {
		const resultEmbed = new MessageEmbed()
			.setDescription(`The count lasted for **${msToHMS(endDate - countingDB.startDate)}**. With **${countingDB.count}** counts and **${countingDB.uniqueParticipants.length}** participants ` +
			`that's an average of one count every **${msToHMS((endDate - countingDB.startDate) / countingDB.count)}**`)
			.setColor('BLURPLE'); // haha nice one discord
		countingChannel.send({ content: message, embeds: [resultEmbed] });
	} else {
		countingChannel.send({ content: message });
	}

	await bot.mongo.collection(DB.COUNTING).findOneAndUpdate({ piece: 'counting' }, { $set: { count: 0, lastSendId: '', startDate: endDate, uniqueParticipants: [] } });
	countingChannel.send('Restarting the counter...\n\n0');
	countingDB = await bot.mongo.collection(DB.COUNTING).findOne({ piece: 'counting' }); // update the counter data
}

export default register;
