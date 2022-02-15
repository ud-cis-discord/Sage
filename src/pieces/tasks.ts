import { CHANNELS, DB } from '@root/config';
import { Client, MessageEmbed, TextChannel } from 'discord.js';
import { schedule } from 'node-cron';
import { Reminder } from '@lib/types/Reminder';
import { Poll } from '@lib/types/Poll';

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
	const polls: Array<Poll> = await bot.mongo.collection<Poll>(DB.POLLS).find({
		expires: { $lte: new Date() }
	}).toArray();
	const emotes = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'];

	polls.forEach(async poll => {
		const mdTimestamp = `<t:${Math.floor(Date.now() / 1000)}:R>`;
		let choiceText = '';
		poll.results.forEach((choice, index) => {
			choiceText += `${emotes[index]} ${choice[0]}: ${choice[1]} vote${choice[1] === 1 ? '' : 's'}\n`;
		});
		choiceText = choiceText.trim();
		const pollEmbed = new MessageEmbed()
			.setTitle(poll.question)
			.setDescription(`This poll was created by ${(await bot.users.fetch(poll.owner)).username} and ended **${mdTimestamp}**`)
			.addField('Choices', choiceText)
			.setColor('RANDOM');
		const pollMsg = await ((await bot.channels.fetch(poll.channel)) as TextChannel).messages.fetch(poll.message);

		pollMsg.edit({ embeds: [pollEmbed], components: [] });

		bot.mongo.collection<Poll>(DB.POLLS).findOneAndDelete(poll);
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
