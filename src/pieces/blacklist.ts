import { BLACKLIST } from '@root/config';
import { Client, Message } from 'discord.js';

async function register(bot: Client): Promise<void> {
	bot.on('messageCreate', async (msg) => filterMessages(msg)
		.catch(async error => bot.emit('error', error))
	);
}

async function filterMessages(msg: Message): Promise<Message | void> {
	if (await filter(msg.content, BLACKLIST)) {
		msg.delete({ reason: `${msg.member} used a bad word.` });

		return msg.author.send(`You used a restricted word. Please refrain from doing so again.`)
			.catch(() => msg.channel.send(`${msg.member}, you used a restricted word. Please refrain from doing so again.`));
	}
	return;
}

function filter(string: string, list: string[]): Promise<boolean> {
	return new Promise((resolve, reject) => {
		if (typeof string !== 'string') reject('"String" param is not a string.');
		string = string.replace(/[.,/#!$%^&*;:{}=\-_`~()@+=?"\u206a]/g, '');

		for (let i = 0; i < list.length; i++) {
			let regex = '';

			for (let j = 0; j < list[i].length; j++) {
				regex = j < 1 ? `${regex}${list[i][j]} *` : j > 1 ? `${regex} *${list[i][j]}` : regex + list[i][j];
			}
			const finishedRegex = new RegExp(regex, 'i');

			const match = string.match(finishedRegex);
			if (match === null) continue;

			if ((match.index !== 0 && string[match.index - 1] !== ' ')
				|| (match.index + match[0].length !== string.length && string[match.index + match[0].length] !== ' ')) resolve(false);

			resolve(true);
		}
	});
}

export default register;
