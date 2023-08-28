import {
	Client,
	GuildChannel,
	DMChannel,
	TextChannel,
	EmbedBuilder,
	EmbedField,
	PermissionsBitField,
	GuildEmoji,
	Invite,
	Message,
	PartialMessage,
	AttachmentBuilder,
	Role,
	Guild,
	ThreadChannel,
	AuditLogEvent,
	OverwriteType
} from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { GUILDS, CHANNELS } from '@root/config';

async function processChannelCreate(channel: GuildChannel | DMChannel, serverLog: TextChannel): Promise<void> {
	if (!('guild' in channel) || channel.guild.id !== GUILDS.MAIN) return;
	const logs = (await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelCreate, limit: 1 })).entries;
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
		const target = overwrite.type === OverwriteType.Role
			? channel.guild.roles.cache.get(overwrite.id).name
			: channel.guild.members.cache.get(overwrite.id).user.tag;
		const allowed = overwrite.allow.bitfield !== BigInt(0)
			? PermissionsBitField.All === overwrite.allow.bitfield
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

	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`Created new ${channel.type} channel, #${channel.name}`)
		.setDescription(`${channel.name} is in the ${channel.parent ? channel.parent.name : 'none'} category.`)
		.addFields(fields)
		.setFooter({ text: `Channel ID: ${channel.id}` })
		.setColor('Purple')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processChannelDelete(channel: GuildChannel | DMChannel, serverLog: TextChannel): Promise<void> {
	if (!('guild' in channel) || channel.guild.id !== GUILDS.MAIN) return;
	const logs = (await channel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelDelete, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`Deleted ${channel.type} channel, #${channel.name}`)
		.addFields(fields)
		.setFooter({ text: `Channel ID: ${channel.id}` })
		.setColor('Purple')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processChannelUpdate(oldChannel: GuildChannel | DMChannel, newChannel: GuildChannel | DMChannel, serverLog: TextChannel): Promise<void> {
	if (!('guild' in newChannel) || !('guild' in oldChannel) || newChannel.guild.id !== GUILDS.MAIN) return;
	const oldTextChannel = oldChannel as TextChannel;
	const newTextChannel = newChannel as TextChannel;

	let toSend = false;
	const logs = (await newChannel.guild.fetchAuditLogs({ type: AuditLogEvent.ChannelUpdate, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	if (!logEntry) return;

	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setFooter({ text: `Channel ID: ${newChannel.id}` })
		.setColor('Purple')
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
			.addFields({ name: 'New topic', value: newTextChannel.topic ? newTextChannel.topic : 'NONE' })
			.addFields({ name: 'Old topic', value: oldTextChannel.topic ? oldTextChannel.topic : 'NONE' });
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
			const target = overwrite.type === OverwriteType.Role
				? newChannel.guild.roles.cache.get(overwrite.id).name.startsWith('@')
					? newChannel.guild.roles.cache.get(overwrite.id).name
					: `@${newChannel.guild.roles.cache.get(overwrite.id).name}`
				: newChannel.guild.members.cache.get(overwrite.id).user.tag;
			const allowed = overwrite.allow.bitfield !== BigInt(0)
				? PermissionsBitField.All === overwrite.allow.bitfield
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
	const logs = (await emote.guild.fetchAuditLogs({ type: AuditLogEvent.EmojiCreate, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`${emote.name} <:${emote.name}:${emote.id}> emote created`)
		.setImage(emote.url)
		.setColor('DarkVividPink')
		.setFooter({ text: `Emote ID: ${emote.id}` })
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processEmojiDelete(emote: GuildEmoji, serverLog: TextChannel): Promise<void> {
	if (emote.guild.id !== GUILDS.MAIN) return;
	const logs = (await emote.guild.fetchAuditLogs({ type: AuditLogEvent.EmojiDelete, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`${emote.name} emote deleted`)
		.setImage(emote.url)
		.setColor('DarkVividPink')
		.setFooter({ text: `Emote ID: ${emote.id}` })
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processEmojiUpdate(oldEmote: GuildEmoji, newEmote: GuildEmoji, serverLog: TextChannel): Promise<void> {
	if (newEmote.guild.id !== GUILDS.MAIN || newEmote.name === oldEmote.name) return;
	const logs = (await newEmote.guild.fetchAuditLogs({ type: AuditLogEvent.EmojiUpdate, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`<:${newEmote.name}:${newEmote.id}> ${oldEmote.name} is now called ${newEmote.name}`)
		.setColor('DarkVividPink')
		.setFooter({ text: `Emote ID: ${newEmote.id}` })
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processInviteCreate(invite: Invite, serverLog: TextChannel): Promise<void> {
	if (invite.guild.id !== GUILDS.MAIN) return;
	// eslint-disable-next-line no-extra-parens
	const logs = (await (invite.guild as Guild).fetchAuditLogs({ type: AuditLogEvent.InviteCreate, limit: 1 })).entries;
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

	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`New invite created`)
		.setDescription(invite.temporary ? 'This invite has temporary on.' : '')
		.addFields(fields)
		.setColor('Green')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processInviteDelete(invite: Invite, serverLog: TextChannel): Promise<void> {
	if (invite.guild.id !== GUILDS.MAIN) return;
	// eslint-disable-next-line no-extra-parens
	const logs = (await (invite.guild as Guild).fetchAuditLogs({ type: AuditLogEvent.InviteDelete, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	if (!logEntry) return;

	if (logEntry.reason?.startsWith('[no log]')) return;
	if (logEntry.changes.find(change => change.key === 'code').old !== invite.code) return;

	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`Invite to ${invite.channel.name} deleted`)
		.setColor('Green')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processMessageDelete(msg: Message | PartialMessage, serverLog: TextChannel): Promise<void> {
	if (!('name' in msg.channel) || msg.guild.id !== GUILDS.MAIN) return;

	let embed;
	if (msg.partial) { // this message is a partial, so author/content information is not available.
		embed = new EmbedBuilder()
			.setTitle(`Message deleted in #${msg.channel.name} | Sent ${msg.createdAt.toLocaleString()} ` +
				`(${prettyMilliseconds(Date.now() - msg.createdTimestamp, { verbose: true })} ago)`)
			.setFooter({ text: `Message ID: ${msg.id}` })
			.setColor('Orange')
			.setTimestamp();
		serverLog.send({ embeds: [embed] });
		return;
	} else {
		embed = new EmbedBuilder()
			.setAuthor({ name: msg.author.tag, iconURL: msg.author.avatarURL() })
			.setTitle(`Message deleted in #${msg.channel.name} | Sent ${msg.createdAt.toLocaleString()} ` +
				`(${prettyMilliseconds(Date.now() - msg.createdTimestamp, { verbose: true })} ago)`)
			.setFooter({ text: `Message ID: ${msg.id} | Author ID: ${msg.author.id}` })
			.setColor('Orange')
			.setTimestamp();
	}

	const attachments: AttachmentBuilder[] = [];

	if (msg.attachments.size > 0) {
		embed.addFields('Attachments', `\`${msg.attachments.map(attachment => attachment.name).join('`, `')}\``);
	}

	if (msg.content.length < 1000) {
		embed.setDescription(msg.content);
	} else {
		let buffer = 'Last displayed content:\n';
		buffer += `${msg.content}\n\n`;

		attachments.push(new AttachmentBuilder(Buffer.from(buffer.trim()), { name: 'Message.txt' }));

		embed.setDescription('Too much data to display, sent as a file.');
	}

	serverLog.send({ embeds: [embed], files: attachments });
}

async function processBulkDelete(messages: Array<Message | PartialMessage>, serverLog: TextChannel): Promise<void> {
	if (!('name' in messages[0].channel) || messages[0].guild.id !== GUILDS.MAIN) return;

	const logs = (await serverLog.guild.fetchAuditLogs({ type: AuditLogEvent.MessageBulkDelete, limit: 1 })).entries;
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

	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`${messages.length} Message${messages.length === 1 ? '' : 's'} bulk deleted`)
		.setDescription(logEntry.reason ? `**Reason**\n${logEntry.reason}` : '')
		.setColor('Orange')
		.setFooter({ text: `Deleter ID: ${logEntry.executor.id}` })
		.setTimestamp();

	serverLog.send({
		embeds: [embed],
		files: [new AttachmentBuilder(Buffer.from(buffer.slice(0, buffer.length - spacer.length).trim()), { name: 'Messages.txt' })]
	});
}

async function processRoleCreate(role: Role, serverLog: TextChannel): Promise<void> {
	if (role.guild.id !== GUILDS.MAIN) return;

	const logs = (await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleCreate, limit: 1 })).entries;
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
			? PermissionsBitField.All === role.permissions.bitfield
				? '`ALL`'
				: `\`${role.permissions.toArray().join('`, `')}\``
			: '`NONE`',
		inline: false
	});

	const embed = new EmbedBuilder()
		.setAuthor({ name: `${logEntry.executor.tag}`, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`Created new role @${role.name}`)
		.addFields(fields)
		.setFooter({ text: `Role ID: ${role.id}` })
		.setColor('DarkBlue')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processRoleDelete(role: Role, serverLog: TextChannel): Promise<void> {
	if (role.guild.id !== GUILDS.MAIN) return;

	const logs = (await role.guild.fetchAuditLogs({ type: AuditLogEvent.RoleDelete, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`Deleted role @${role.name}`)
		.addFields(fields)
		.setFooter({ text: `Role ID: ${role.id}` })
		.setColor('DarkBlue')
		.setTimestamp();
	serverLog.send({ embeds: [embed] });
}

async function processRoleUpdate(oldRole: Role, newRole: Role, serverLog: TextChannel): Promise<void> {
	if (newRole.guild.id !== GUILDS.MAIN) return;

	const logs = (await newRole.guild.fetchAuditLogs({ type: AuditLogEvent.RoleUpdate, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	let toSend = false;
	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`@${newRole.name} role updated`)
		.setColor('DarkBlue')
		.setFooter({ text: `Role ID: ${newRole.id}` })
		.setTimestamp();

	if (newRole.name !== oldRole.name) {
		toSend = true;
		embed.addFields({ name: 'New name', value: newRole.name, inline: false });
		embed.addFields({ name: 'Old name', value: oldRole.name, inline: false });
	}

	if (!newRole.permissions.equals(oldRole.permissions)) {
		toSend = true;
		embed.addFields({ name: 'Permissions',
			value: newRole.permissions.bitfield !== BigInt(0)
				? PermissionsBitField.All === newRole.permissions.bitfield
					? '`ALL`'
					: `\`${newRole.permissions.toArray().join('`, `')}\``
				: '`NONE`' }
		);
	}

	if (toSend) {
		serverLog.send({ embeds: [embed] });
	}
}

async function processThreadCreate(thread: ThreadChannel, serverLog: TextChannel): Promise<void> {
	if (thread.guild.id !== GUILDS.MAIN) return;

	const logs = (await thread.guild.fetchAuditLogs({ type: AuditLogEvent.ThreadCreate, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`Thread created: "${thread.name}"`)
		.setFields([{ name: 'Thread type', inline: true, value: `${thread.type}` }])
		.setDescription(`<#${thread.id}>`)
		.setColor('Greyple')
		.setFooter({ text: `Thread ID: ${thread.id}` })
		.setTimestamp();

	serverLog.send({ embeds: [embed] });
}

async function processThreadDelete(thread: ThreadChannel, serverLog: TextChannel): Promise<void> {
	if (thread.guild.id !== GUILDS.MAIN) return;

	const logs = (await thread.guild.fetchAuditLogs({ type: AuditLogEvent.ThreadDelete, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`Thread deleted: "${thread.name}"`)
		.setFields([{ name: 'Thread type', inline: true, value: `${thread.type}` }])
		.setColor('Greyple')
		.setFooter({ text: `Thread ID: ${thread.id}` })
		.setTimestamp();

	serverLog.send({ embeds: [embed] });
}

async function processThreadUpdate(oldThread: ThreadChannel, newThread: ThreadChannel, serverLog: TextChannel): Promise<void> {
	if (newThread.guild.id !== GUILDS.MAIN) return;

	const logs = (await newThread.guild.fetchAuditLogs({ type: AuditLogEvent.ThreadUpdate, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	const embed = new EmbedBuilder()
		.setAuthor({ name: logEntry.executor.tag, iconURL: logEntry.executor.avatarURL() })
		.setTitle(`Thread updated: "${newThread.name}"`)
		.setFields([{ name: 'Thread type', inline: false, value: `${newThread.type}` }])
		.setDescription(`<#${newThread.id}>`)
		.setColor('Greyple')
		.setFooter({ text: `Thread ID: ${newThread.id}` })
		.setTimestamp();

	if (newThread.name !== oldThread.name) {
		embed.addFields({ name: 'New name', value: newThread.name, inline: false });
		embed.addFields({ name: 'Old name', value: oldThread.name, inline: false });
	}

	if (newThread.archived !== oldThread.archived) {
		embed.addFields({ name: 'Archive status updated', value: `Changed from ${
			oldThread.archived ? 'archived to unarchived' : 'unarchived to archived'
		}.` });
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
