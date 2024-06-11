import { CHANNELS, DB } from '@root/config';
import { ChannelType, Client, EmbedBuilder, TextChannel } from 'discord.js';
import { schedule } from 'node-cron';
import { Reminder } from '@lib/types/Reminder';
import { Poll, PollResult } from '@lib/types/Poll';

async function register(bot: Client): Promise<void> {
	schedule('0/30 * * * * *', () => {
		handleCron(bot)
			.catch(async error => bot.emit('error', error));
	});
}

async function handleCron(bot: Client): Promise<void> {
	checkPolls(bot);
	checkReminders(bot);
}

async function checkPolls(bot: Client): Promise<void> {
	const polls: Poll[] = await bot.mongo.collection<Poll>(DB.POLLS).find({
		expires: { $lte: new Date() }
	}).toArray();
	const emotes = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

	polls.forEach(async poll => {
		const mdTimestamp = `<t:${Math.floor(Date.now() / 1000)}:R>`;

		// figure out the winner and also put the results in a map for ease of use
		const resultMap = new Map<string, number>();
		let winners: PollResult[] = [];
		poll.results.forEach(res => {
			resultMap.set(res.option, res.users.length);
			if (!winners[0]) {
				winners = [res];
				return;
			}
			if (winners[0] && res.users.length > winners[0].users.length) winners = [res];
			else if (res.users.length === winners[0].users.length) winners.push(res);
		});

		// build up the win string
		let winMessage: string;
		const winCount = winners[0].users.length;
		if (winCount === 0) {
			winMessage = `It looks like no one has voted!`;
		} else if (winners.length === 1) {
			winMessage = `**${winners[0].option}** has won the poll with ${winCount} vote${winCount === 1 ? '' : 's'}!`;
		} else {
			winMessage = `**${
				winners.slice(0, -1).map(win => win.option).join(', ')
			} and ${
				winners.slice(-1)[0].option
			}** have won the poll with ${winners[0].users.length} vote${winCount === 1 ? '' : 's'} each!`;
		}

		// build up the text that is on the final poll embed
		let choiceText = '';
		let count = 0;
		resultMap.forEach((value, key) => {
			choiceText += `${emotes[count++]} ${key}: ${value} vote${value === 1 ? '' : 's'}\n`;
		});

		const pollChannel = await bot.channels.fetch(poll.channel);
		if (pollChannel.type !== ChannelType.GuildText) throw 'something went wrong fetching the poll\'s channel';
		const pollMsg = await pollChannel.messages.fetch(poll.message);
		const owner = await pollMsg.guild.members.fetch(poll.owner);
		const pollEmbed = new EmbedBuilder()
			.setTitle(poll.question)
			.setDescription(`This poll was created by ${owner.displayName} and ended **${mdTimestamp}**`)
			.addFields({ name: `Winner${winners.length === 1 ? '' : 's'}`, value: winMessage })
			.addFields({ name: 'Choices', value: choiceText })
			.setColor('Random');

		pollMsg.edit({ embeds: [pollEmbed], components: [] });


		pollMsg.channel.send({ embeds: [new EmbedBuilder()
			.setTitle(poll.question)
			.setDescription(`${owner}'s poll has ended!`)
			.addFields({ name: `Winner${winners.length === 1 ? '' : 's'}`, value: winMessage })
			.addFields({ name: 'Original poll', value: `Click [here](${pollMsg.url}) to see the original poll.` })
			.setColor('Random')
		] });

		await bot.mongo.collection<Poll>(DB.POLLS).findOneAndDelete(poll);
	});
}

async function checkReminders(bot: Client): Promise<void> {
	const reminders: Array<Reminder> = await bot.mongo.collection(DB.REMINDERS).find({
		expires: { $lte: new Date() }
	}).toArray();
	const pubChan = await bot.channels.fetch(CHANNELS.SAGE) as TextChannel;

	reminders.forEach(reminder => {
		const message = `<@${reminder.owner}>, here's the reminder you asked for: **${reminder.content}**`;

		if (reminder.mode === 'public') {
			pubChan.send(message);
		} else {
			bot.users.fetch(reminder.owner).then(user => user.send(message).catch(() => {
				pubChan.send(`<@${reminder.owner}>, I tried to send you a DM about your private reminder but it looks like you have
DMs closed. Please enable DMs in the future if you'd like to get private reminders.`);
			}));
		}

		// copied value by value for several reasons, change it and I take no responsibility for it breaking.
		const newReminder: Reminder = {
			content: reminder.content,
			expires: new Date(reminder.expires),
			mode: reminder.mode,
			repeat: reminder.repeat,
			owner: reminder.owner
		};

		if (reminder.repeat === 'daily') {
			newReminder.expires.setDate(reminder.expires.getDate() + 1);
			bot.mongo.collection(DB.REMINDERS).findOneAndReplace(reminder, newReminder);
		} else if (reminder.repeat === 'weekly') {
			newReminder.expires.setDate(reminder.expires.getDate() + 7);
			bot.mongo.collection(DB.REMINDERS).findOneAndReplace(reminder, newReminder);
		} else {
			bot.mongo.collection(DB.REMINDERS).findOneAndDelete(reminder);
		}
	});
}

export default register;
