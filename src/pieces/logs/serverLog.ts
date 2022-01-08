import {
	Client,
	GuildChannel,
	DMChannel,
	TextChannel,
	MessageEmbed,
	EmbedField,
	Permissions,
	GuildEmoji,
	Invite,
	Message,
	PartialMessage,
	MessageAttachment,
	Role,
	Guild,
	ThreadChannel
} from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { GUILDS, CHANNELS, DB } from '@root/config';
import { SageUser } from '@root/src/lib/types/SageUser';

async function processChannelCreate(channel: GuildChannel | DMChannel, serverLog: TextChannel): Promise<void> {
	if (!('guild' in channel) || channel.guild.id !== GUILDS.MAIN) return;
	const logs = (await channel.guild.fetchAuditLogs({ type: 'CHANNEL_CREATE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	channel.permissionOverwrites.cache.forEach(overwrite => {
		const target = overwrite.type === 'role'
			? channel.guild.roles.cache.get(overwrite.id).name
			: channel.guild.members.cache.get(overwrite.id).user.tag;
		const allowed = overwrite.allow.bitfield !== BigInt(0)
			? Permissions.ALL === overwrite.allow.bitfield
				? '`ALL`'
				: `\`${overwrite.allow.toArray().join('`, `')}\``
			: '`NONE`';
		const denied = overwrite.deny.bitfield !== BigInt(0)
			? `\`${overwrite.deny.toArray().join('`, `')}\``
			: '`NONE`';

		fields.push({
			name: `Overwrites for ${target}`,
			value: `**Allowed**\n${allowed}\n**Denied**\n${denied}`,
			inline: false
		});
	});

	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Created new ${channel.type} channel, #${channel.name}`)
		.setDescription(`${channel.name} is in the ${channel.parent ? channel.parent.name : 'none'} category.`)
		.addFields(fields)
		.setFooter(`Channel ID: ${channel.id}`)
		.setColor('PURPLE')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processChannelDelete(channel: GuildChannel | DMChannel, serverLog: TextChannel): Promise<void> {
	if (!('guild' in channel) || channel.guild.id !== GUILDS.MAIN) return;
	const logs = (await channel.guild.fetchAuditLogs({ type: 'CHANNEL_DELETE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Deleted ${channel.type} channel, #${channel.name}`)
		.addFields(fields)
		.setFooter(`Channel ID: ${channel.id}`)
		.setColor('PURPLE')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processChannelUpdate(oldChannel: GuildChannel | DMChannel, newChannel: GuildChannel | DMChannel, serverLog: TextChannel): Promise<void> {
	if (!('guild' in newChannel) || !('guild' in oldChannel) || newChannel.guild.id !== GUILDS.MAIN) return;
	const oldTextChannel = oldChannel as TextChannel;
	const newTextChannel = newChannel as TextChannel;

	let toSend = false;
	const logs = (await newChannel.guild.fetchAuditLogs({ type: 'CHANNEL_UPDATE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	if (!logEntry) return;

	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
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

	if (!toSend && oldTextChannel.topic !== newTextChannel.topic) {
		toSend = true;
		embed.setTitle(`#${newChannel.name} had a topic change.`)
			.addField('New topic', newTextChannel.topic ? newTextChannel.topic : 'NONE')
			.addField('Old topic', oldTextChannel.topic ? oldTextChannel.topic : 'NONE');
	}

	if (!toSend && !oldChannel.permissionOverwrites.cache.every((oldOverride, key) => {
		const newOverride = newChannel.permissionOverwrites.cache.get(key);
		return newOverride?.allow.equals(oldOverride.allow)
			&& newOverride?.deny.equals(oldOverride.deny)
			&& newOverride?.id === oldOverride.id
			&& newOverride?.type === oldOverride.type
			&& newOverride?.channel === oldOverride.channel;
	})) {
		toSend = true;
		embed.setTitle(`#${newChannel.name} had a permission change`);
		newChannel.permissionOverwrites.cache.forEach(overwrite => {
			const target = overwrite.type === 'role'
				? newChannel.guild.roles.cache.get(overwrite.id).name.startsWith('@')
					? newChannel.guild.roles.cache.get(overwrite.id).name
					: `@${newChannel.guild.roles.cache.get(overwrite.id).name}`
				: newChannel.guild.members.cache.get(overwrite.id).user.tag;
			const allowed = overwrite.allow.bitfield !== BigInt(0)
				? Permissions.ALL === overwrite.allow.bitfield
					? '`ALL`'
					: `\`${overwrite.allow.toArray().join('`, `')}\``
				: '`NONE`';
			const denied = overwrite.deny.bitfield !== BigInt(0)
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
		serverLog.send({ embeds: [embed] });
	}
}

async function processEmojiCreate(emote: GuildEmoji, serverLog: TextChannel): Promise<void> {
	if (emote.guild.id !== GUILDS.MAIN) return;
	const logs = (await emote.guild.fetchAuditLogs({ type: 'EMOJI_CREATE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`${emote.name} <:${emote.name}:${emote.id}> emote created`)
		.setImage(emote.url)
		.setColor('DARK_VIVID_PINK')
		.setFooter(`Emote ID: ${emote.id}`)
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processEmojiDelete(emote: GuildEmoji, serverLog: TextChannel): Promise<void> {
	if (emote.guild.id !== GUILDS.MAIN) return;
	const logs = (await emote.guild.fetchAuditLogs({ type: 'EMOJI_DELETE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`${emote.name} emote deleted`)
		.setImage(emote.url)
		.setColor('DARK_VIVID_PINK')
		.setFooter(`Emote ID: ${emote.id}`)
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processEmojiUpdate(oldEmote: GuildEmoji, newEmote: GuildEmoji, serverLog: TextChannel): Promise<void> {
	if (newEmote.guild.id !== GUILDS.MAIN || newEmote.name === oldEmote.name) return;
	const logs = (await newEmote.guild.fetchAuditLogs({ type: 'EMOJI_UPDATE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`<:${newEmote.name}:${newEmote.id}> ${oldEmote.name} is now called ${newEmote.name}`)
		.setColor('DARK_VIVID_PINK')
		.setFooter(`Emote ID: ${newEmote.id}`)
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processInviteCreate(invite: Invite, serverLog: TextChannel): Promise<void> {
	if (invite.guild.id !== GUILDS.MAIN) return;
	// eslint-disable-next-line no-extra-parens
	const logs = (await (invite.guild as Guild).fetchAuditLogs({ type: 'INVITE_CREATE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	if (logEntry.reason?.startsWith('[no log]')) return;

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	fields.push({
		name: 'Channel',
		value: invite.channel.toString(),
		inline: true
	});
	fields.push({
		name: 'Code',
		value: invite.code,
		inline: true
	});
	fields.push({
		name: 'Uses',
		value: invite.maxUses === 0
			? 'Infinite'
			: `${invite.maxUses}`,
		inline: true
	});
	fields.push({
		name: 'Age',
		value: invite.maxAge === 0
			? 'Infinite'
			: prettyMilliseconds(invite.maxAge * 1e3, { verbose: true }),
		inline: true
	});

	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`New invite created`)
		.setDescription(invite.temporary ? 'This invite has temporary on.' : '')
		.addFields(fields)
		.setColor('GREEN')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processInviteDelete(invite: Invite, serverLog: TextChannel): Promise<void> {
	if (invite.guild.id !== GUILDS.MAIN) return;
	// eslint-disable-next-line no-extra-parens
	const logs = (await (invite.guild as Guild).fetchAuditLogs({ type: 'INVITE_DELETE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	if (!logEntry) return;

	if (logEntry.reason?.startsWith('[no log]')) return;
	if (logEntry.changes.find(change => change.key === 'code').old !== invite.code) return;

	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Invite to ${invite.channel.name} deleted`)
		.setColor('GREEN')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processMessageDelete(msg: Message | PartialMessage, serverLog: TextChannel): Promise<void> {
	if (!('name' in msg.channel) || msg.guild.id !== GUILDS.MAIN) return;
	const embed = new MessageEmbed()
		.setAuthor(msg.author.tag, msg.author.avatarURL({ dynamic: true }))
		.setTitle(`Message deleted in #${msg.channel.name} | Sent ${msg.createdAt.toLocaleString()} ` +
			`(${prettyMilliseconds(Date.now() - msg.createdTimestamp, { verbose: true })} ago)`)
		.setFooter(`Message ID: ${msg.id} | Author ID: ${msg.author.id}`)
		.setColor('ORANGE')
		.setTimestamp();

	const attachments: MessageAttachment[] = [];

	if (msg.attachments.size > 0) {
		embed.addField('Attachments', `\`${msg.attachments.map(attachment => attachment.name).join('`, `')}\``);
	}

	if (msg.content.length < 1000) {
		embed.setDescription(msg.content);
	} else {
		let buffer = 'Last displayed content:\n';
		buffer += `${msg.content}\n\n`;

		attachments.push(new MessageAttachment(Buffer.from(buffer.trim()), 'Message.txt'));

		embed.setDescription('Too much data to display, sent as a file.');
	}

	serverLog.send({ embeds: [embed], files: attachments });

	const bot = msg.client;
	handleExpDetract(bot, msg);
}

async function handleExpDetract(bot: Client, msg: Message | PartialMessage) {
	const user: SageUser = await msg.author.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });
	console.log(user);
	// bot.mongo.collection(DB.USERS).findOneAndUpdate(
	// 	{ user },
	// 	{ $inc: { count: -1, curExp: +1 } }
	// );
	if (user.curExp < user.levelExp) {
		bot.mongo.collection(DB.USERS).findOneAndUpdate(
			{ discordId: msg.author.id },
			{ $inc: { count: 0, curExp: +1 } }
		);
	} else { // we can't have negative exp
		bot.mongo.collection(DB.USERS).findOneAndUpdate(
			{ discordId: msg.author.id },
			{ $inc: { count: 0, curExp: 0 } }
		);
	}

	if (user.count < 1) {
		bot.mongo.collection(DB.USERS).findOneAndUpdate(
			{ discordId: msg.author.id },
			{ $inc: { count: 0, curExp: 0 } }
		);
	} else { // we can't have negative message counts
		bot.mongo.collection(DB.USERS).findOneAndUpdate(
			{ discordId: msg.author.id },
			{ $inc: { count: -1, curExp: 0 } }
		);
	}
}

async function processBulkDelete(messages: Array<Message | PartialMessage>, serverLog: TextChannel): Promise<void> {
	if (!('name' in messages[0].channel) || messages[0].guild.id !== GUILDS.MAIN) return;

	const logs = (await serverLog.guild.fetchAuditLogs({ type: 'MESSAGE_BULK_DELETE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const spacer = '\n\n**************************************************************************\n\n';
	let buffer = '';

	// I present, the most ugly code in the entire codebase.
	messages.forEach((msg, msgIdx) => {
		if ('name' in msg.channel) {
			buffer += `Message ${msgIdx} sent in #${msg.channel.name} by ${msg.author.tag} (${msg.author.id}) at ${msg.createdAt.toLocaleString()} ` +
				`(${prettyMilliseconds(Date.now() - msg.createdTimestamp, { verbose: true })} ago)\n`;

			if (msg.attachments.size > 0) {
				buffer += `Attachments: ${msg.attachments.map(attachment => attachment.name).join(', ')}\n`;
			}

			buffer += `Last displayed content of message ${msgIdx}:\n${msg.content}\n\n`;

			buffer = buffer.trim() + spacer;
		}
	});

	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`${messages.length} Message${messages.length === 1 ? '' : 's'} bulk deleted`)
		.setDescription(logEntry.reason ? `**Reason**\n${logEntry.reason}` : '')
		.setColor('ORANGE')
		.setFooter(`Deleter ID: ${logEntry.executor.id}`)
		.setTimestamp();

	serverLog.send({
		embeds: [embed],
		files: [new MessageAttachment(Buffer.from(buffer.slice(0, buffer.length - spacer.length).trim()), 'Messages.txt')]
	});
}

async function processRoleCreate(role: Role, serverLog: TextChannel): Promise<void> {
	if (role.guild.id !== GUILDS.MAIN) return;

	const logs = (await role.guild.fetchAuditLogs({ type: 'ROLE_CREATE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	fields.push({
		name: 'Permissions',
		value: role.permissions.bitfield !== BigInt(0)
			? Permissions.ALL === role.permissions.bitfield
				? '`ALL`'
				: `\`${role.permissions.toArray().join('`, `')}\``
			: '`NONE`',
		inline: false
	});

	const embed = new MessageEmbed()
		.setAuthor(`${logEntry.executor.tag}`, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Created new role @${role.name}`)
		.addFields(fields)
		.setFooter(`Role ID: ${role.id}`)
		.setColor('DARK_BLUE')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processRoleDelete(role: Role, serverLog: TextChannel): Promise<void> {
	if (role.guild.id !== GUILDS.MAIN) return;

	const logs = (await role.guild.fetchAuditLogs({ type: 'ROLE_DELETE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Deleted role @${role.name}`)
		.addFields(fields)
		.setFooter(`Role ID: ${role.id}`)
		.setColor('DARK_BLUE')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processRoleUpdate(oldRole: Role, newRole: Role, serverLog: TextChannel): Promise<void> {
	if (newRole.guild.id !== GUILDS.MAIN) return;

	const logs = (await newRole.guild.fetchAuditLogs({ type: 'ROLE_UPDATE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	let toSend = false;
	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`@${newRole.name} role updated`)
		.setColor('DARK_BLUE')
		.setFooter(`Role ID: ${newRole.id}`)
		.setTimestamp();

	if (newRole.name !== oldRole.name) {
		toSend = true;
		embed.addField('New name', newRole.name, true);
		embed.addField('Old name', oldRole.name, true);
	}

	if (!newRole.permissions.equals(oldRole.permissions)) {
		toSend = true;
		embed.addField(
			'Permissions',
			newRole.permissions.bitfield !== BigInt(0)
				? Permissions.ALL === newRole.permissions.bitfield
					? '`ALL`'
					: `\`${newRole.permissions.toArray().join('`, `')}\``
				: '`NONE`'
		);
	}

	if (toSend) {
		serverLog.send({ embeds: [embed] });
	}
}

async function processThreadCreate(thread: ThreadChannel, serverLog: TextChannel): Promise<void> {
	if (thread.guild.id !== GUILDS.MAIN) return;

	const logs = (await thread.guild.fetchAuditLogs({ type: 'THREAD_CREATE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Thread created: "${thread.name}"`)
		.setFields([{ name: 'Thread type', inline: true, value: `${thread.type}` }])
		.setDescription(`<#${thread.id}>`)
		.setColor('GREYPLE')
		.setFooter(`Thread ID: ${thread.id}`)
		.setTimestamp();

	serverLog.send({ embeds: [embed] });
}

async function processThreadDelete(thread: ThreadChannel, serverLog: TextChannel): Promise<void> {
	if (thread.guild.id !== GUILDS.MAIN) return;

	const logs = (await thread.guild.fetchAuditLogs({ type: 'THREAD_DELETE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Thread deleted: "${thread.name}"`)
		.setFields([{ name: 'Thread type', inline: true, value: `${thread.type}` }])
		.setColor('GREYPLE')
		.setFooter(`Thread ID: ${thread.id}`)
		.setTimestamp();

	serverLog.send({ embeds: [embed] });
}

async function processThreadUpdate(oldThread: ThreadChannel, newThread: ThreadChannel, serverLog: TextChannel): Promise<void> {
	if (newThread.guild.id !== GUILDS.MAIN) return;

	const logs = (await newThread.guild.fetchAuditLogs({ type: 'THREAD_UPDATE', limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	const embed = new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Thread updated: "${newThread.name}"`)
		.setFields([{ name: 'Thread type', inline: false, value: `${newThread.type}` }])
		.setDescription(`<#${newThread.id}>`)
		.setColor('GREYPLE')
		.setFooter(`Thread ID: ${newThread.id}`)
		.setTimestamp();

	if (newThread.name !== oldThread.name) {
		embed.addField('New name', newThread.name, false);
		embed.addField('Old name', oldThread.name, false);
	}

	if (newThread.archived !== oldThread.archived) {
		embed.addField('Archive status updated', `Changed from ${
			oldThread.archived ? 'archived to unarchived' : 'unarchived to archived'
		}.`);
	}

	serverLog.send({ embeds: [embed] });
	return;
}

async function register(bot: Client): Promise<void> {
	const serverLog = await bot.channels.fetch(CHANNELS.SERVER_LOG) as TextChannel;

	bot.on('channelCreate', (channel: GuildChannel | DMChannel) => {
		processChannelCreate(channel, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('channelDelete', (channel: GuildChannel | DMChannel) => {
		processChannelDelete(channel, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('channelUpdate', (oldChannel: GuildChannel | DMChannel, newChannel: GuildChannel | DMChannel) => {
		processChannelUpdate(oldChannel, newChannel, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('emojiCreate', emote => {
		processEmojiCreate(emote, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('emojiDelete', emote => {
		processEmojiDelete(emote, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('emojiUpdate', (oldEmote, newEmote) => {
		processEmojiUpdate(oldEmote, newEmote, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('inviteCreate', invite => {
		processInviteCreate(invite, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('inviteDelete', invite => {
		processInviteDelete(invite, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('messageDelete', message => {
		processMessageDelete(message, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('messageDeleteBulk', messages => {
		processBulkDelete([...messages.values()].reverse(), serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('roleCreate', role => {
		processRoleCreate(role, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('roleDelete', role => {
		processRoleDelete(role, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('roleUpdate', (oldRole, newRole) => {
		processRoleUpdate(oldRole, newRole, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('threadCreate', (thread) => {
		processThreadCreate(thread, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('threadDelete', (thread) => {
		processThreadDelete(thread, serverLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('threadUpdate', (oldThread, newThread) => {
		processThreadUpdate(oldThread, newThread, serverLog)
			.catch(async error => bot.emit('error', error));
	});
}

export default register;
