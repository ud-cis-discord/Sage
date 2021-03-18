import { CHANNELS, DB } from '@root/config';
import { Client, TextChannel } from 'discord.js';
import { schedule } from 'node-cron';
import { generateLogEmbed } from '@lib/utils';
import { Reminder } from '@lib/types/Reminder';

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(CHANNELS.ERROR_LOG) as TextChannel;
	schedule('* * * * *', () => {
		handleCron(bot)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});
}

async function handleCron(bot: Client): Promise<void> {
	const reminders: Array<Reminder> = await bot.mongo.collection(DB.REMINDERS).find({
		expires: { $lte: new Date() }
	}).toArray();
	const pubChan = await bot.channels.fetch(CHANNELS.SAGE) as TextChannel;

	reminders.forEach(reminder => {
		const message = `<@${reminder.owner}>, here's the reminder you asked for: **${reminder.content}**`;

		if (reminder.mode === 'public') {
			pubChan.send(message);
		} else {
			bot.users.fetch(reminder.owner).then(user => user.send(message));
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
