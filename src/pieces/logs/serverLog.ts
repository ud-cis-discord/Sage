import { generateLogEmbed } from '@lib/utils';
import { GUILDS, LOG } from '@root/config';
import { Client, GuildChannel, DMChannel, TextChannel, MessageEmbed, EmbedField, Permissions, GuildEmoji } from 'discord.js';

async function processChannelCreate(channel: GuildChannel | DMChannel, serverLog: TextChannel): Promise<void> {
	if (!('guild' in channel) || channel.guild.id !== GUILDS.MAIN) return;
	const [logEntry] = (await channel.guild.fetchAuditLogs({ type: 'CHANNEL_CREATE', limit: 1 })).entries.array();

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	serverLog.send(new MessageEmbed()
		.setAuthor(`${logEntry.executor.tag} (${logEntry.executor.id})`, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Created new ${channel.type} channel, #${channel.name}`)
		.setDescription(`${channel.name} is in the ${channel.parent ? channel.parent.name : 'none'} category.`)
		.addFields(fields)
		.setFooter(`Channel ID: ${channel.id}`)
		.setColor('PURPLE')
		.setTimestamp());
}

async function processChannelDelete(channel: GuildChannel | DMChannel, serverLog: TextChannel): Promise<void> {
	if (!('guild' in channel) || channel.guild.id !== GUILDS.MAIN) return;
	const [logEntry] = (await channel.guild.fetchAuditLogs({ type: 'CHANNEL_DELETE', limit: 1 })).entries.array();

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	serverLog.send(new MessageEmbed()
		.setAuthor(`${logEntry.executor.tag} (${logEntry.executor.id})`, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Deleted ${channel.type} channel, #${channel.name}`)
		.addFields(fields)
		.setFooter(`Channel ID: ${channel.id}`)
		.setColor('PURPLE')
		.setTimestamp());
}

async function processChannelUpdate(oldChannel: GuildChannel | DMChannel, newChannel: GuildChannel | DMChannel, serverLog: TextChannel): Promise<void> {
	if (!('guild' in newChannel) || !('guild' in oldChannel) || newChannel.guild.id !== GUILDS.MAIN) return;

	let toSend = false;
	const [logEntry] = (await newChannel.guild.fetchAuditLogs({ type: 'CHANNEL_UPDATE', limit: 1 })).entries.array();
	const embed = new MessageEmbed()
		.setAuthor(`${logEntry.executor.tag} (${logEntry.executor.id})`, logEntry.executor.avatarURL({ dynamic: true }))
		.setFooter(`Channel ID: ${newChannel.id}`)
		.setColor('PURPLE')
		.setTimestamp();

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	if (!toSend && oldChannel.name !== newChannel.name) {
		toSend = true;
		embed.setTitle(`#${oldChannel.name} is now called #${newChannel.name}`);
	}

	if (!toSend && !oldChannel.permissionOverwrites.equals(newChannel.permissionOverwrites)) {
		toSend = true;
		embed.setTitle(`#${newChannel.name} had a permission change`);
		newChannel.permissionOverwrites.forEach(overwrite => {
			const target = overwrite.type === 'role'
				? newChannel.guild.roles.cache.get(overwrite.id).name
				: newChannel.guild.members.cache.get(overwrite.id).user.tag;
			const allowed = overwrite.allow.bitfield !== 0
				? Permissions.ALL === overwrite.allow.bitfield
					? '`ALL`'
					: `\`${overwrite.allow.toArray().join('`, `')}\``
				: '`NONE`';
			const denied = overwrite.deny.bitfield !== 0
				? `\`${overwrite.deny.toArray().join('`, `')}\``
				: '`NONE`';

			fields.push({
				name: `Overwrites for ${target}`,
				value: `**Allowed**\n${allowed}\n**Denied**\n${denied}`,
				inline: false
			});
		});
	}

	if (toSend) {
		embed.addFields(fields);
		serverLog.send(embed);
	}
}

async function processEmojiCreate(emote: GuildEmoji, serverLog: TextChannel): Promise<void> {
	if (emote.guild.id !== GUILDS.MAIN) return;
	const [logEntry] = (await emote.guild.fetchAuditLogs({ type: 'EMOJI_CREATE', limit: 1 })).entries.array();

	serverLog.send(new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`${emote.name} <:${emote.name}:${emote.id}> emote created`)
		.setImage(emote.url)
		.setColor('DARK_VIVID_PINK')
		.setFooter(`Emote ID: ${emote.id}`)
		.setTimestamp());
}

async function processEmojiDelete(emote: GuildEmoji, serverLog: TextChannel): Promise<void> {
	if (emote.guild.id !== GUILDS.MAIN) return;
	const [logEntry] = (await emote.guild.fetchAuditLogs({ type: 'EMOJI_DELETE', limit: 1 })).entries.array();

	serverLog.send(new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`${emote.name} emote deleted`)
		.setImage(emote.url)
		.setColor('DARK_VIVID_PINK')
		.setFooter(`Emote ID: ${emote.id}`)
		.setTimestamp());
}

async function processEmojiUpdate(oldEmote: GuildEmoji, newEmote: GuildEmoji, serverLog: TextChannel): Promise<void> {
	if (newEmote.guild.id !== GUILDS.MAIN || newEmote.name === oldEmote.name) return;
	const [logEntry] = (await newEmote.guild.fetchAuditLogs({ type: 'EMOJI_UPDATE', limit: 1 })).entries.array();

	serverLog.send(new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`<:${newEmote.name}:${newEmote.id}> ${oldEmote.name} is now called ${newEmote.name}`)
		.setColor('DARK_VIVID_PINK')
		.setFooter(`Emote ID: ${newEmote.id}`)
		.setTimestamp());
}

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(LOG.ERROR) as TextChannel;
	const serverLog = await bot.channels.fetch(LOG.SERVER) as TextChannel;

	bot.on('channelCreate', (channel: GuildChannel | DMChannel) => {
		processChannelCreate(channel, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('channelDelete', (channel: GuildChannel | DMChannel) => {
		processChannelDelete(channel, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('channelUpdate', (oldChannel: GuildChannel | DMChannel, newChannel: GuildChannel | DMChannel) => {
		processChannelUpdate(oldChannel, newChannel, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('emojiCreate', emote => {
		processEmojiCreate(emote, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('emojiDelete', emote => {
		processEmojiDelete(emote, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('emojiUpdate', (oldEmote, newEmote) => {
		processEmojiUpdate(oldEmote, newEmote, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});
}

export default register;
