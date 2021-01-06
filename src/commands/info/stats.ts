import { EmbedField, Message, MessageEmbed } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { SageClient } from '@lib/types/SageClient';
import { BOT } from '@root/config';

export const description = 'Displays info about Sage\'s current status';

export function run(msg: Message): Promise<Message> {
	const fields: Array<EmbedField> = [];
	const bot = msg.client as SageClient;

	fields.push({
		name: 'Uptime',
		value: prettyMilliseconds(bot.uptime),
		inline: true
	});
	fields.push({
		name: 'Users',
		value: `${bot.users.cache.size}`,
		inline: true
	});
	fields.push({
		name: 'Channels',
		value: `${bot.channels.cache.size}`,
		inline: true
	});
	fields.push({
		name: 'Servers',
		value: `${bot.guilds.cache.size}`,
		inline: true
	});
	fields.push({
		name: 'Memory Usage',
		value: `${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB`,
		inline: true
	});

	const embed = new MessageEmbed()
		.setColor('DARK_GREEN')
		.setAuthor(`${BOT.NAME} Stats`, bot.user.displayAvatarURL())
		.setTimestamp(Date.now())
		.addFields(fields);

	return msg.channel.send(embed);
}
