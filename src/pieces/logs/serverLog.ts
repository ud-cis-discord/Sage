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
	Role
} from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { generateLogEmbed } from '@lib/utils';
import { GUILDS, CHANNELS } from '@root/config';

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

	channel.permissionOverwrites.forEach(overwrite => {
		const target = overwrite.type === 'role'
			? channel.guild.roles.cache.get(overwrite.id).name
			: channel.guild.members.cache.get(overwrite.id).user.tag;
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

	serverLog.send(new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
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
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
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

async function processInviteCreate(invite: Invite, serverLog: TextChannel): Promise<void> {
	if (invite.guild.id !== GUILDS.MAIN) return;
	const [logEntry] = (await invite.guild.fetchAuditLogs({ type: 'INVITE_CREATE', limit: 1 })).entries.array();

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

	serverLog.send(new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`New invite created`)
		.setDescription(invite.temporary ? 'This invite has temporary on.' : '')
		.addFields(fields)
		.setColor('GREEN')
		.setTimestamp());
}

async function processInviteDelete(invite: Invite, serverLog: TextChannel): Promise<void> {
	if (invite.guild.id !== GUILDS.MAIN) return;
	const [logEntry] = (await invite.guild.fetchAuditLogs({ type: 'INVITE_DELETE', limit: 1 })).entries.array();

	if (logEntry.reason?.startsWith('[no log]')) return;
	if (logEntry.changes.find(change => change.key === 'code').old !== invite.code) return;

	serverLog.send(new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Invite to ${invite.channel.name} deleted`)
		.setColor('GREEN')
		.setTimestamp());
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

	if (msg.attachments.size > 0) {
		embed.addField('Attachments', `\`${msg.attachments.map(attachment => attachment.name).join('`, `')}\``);
	}

	const edits = msg.edits.reverse();

	if (edits.length < 24 && edits.every(m => m.content.length < 1000) && edits.map(m => m.content).join().length < 5500) {
		embed.setDescription(edits.pop().content);
		edits.forEach((edit, idx) => {
			embed.addField(`Message ${idx + 1}`, edit.content);
		});
	} else {
		let buffer = 'Last displayed content:\n';
		buffer += `${edits.pop().content}\n\n`;

		edits.forEach((edit, idx) => {
			buffer += `Message ${idx + 1}\n${edit.content}\n\n`;
		});

		const file = new MessageAttachment(Buffer.from(buffer.trim()), 'Message.txt');

		embed.setDescription('Too much data to display, sent as a file.')
			.attachFiles([file]);
	}

	serverLog.send(embed);
}

async function processBulkDelete(messages: Array<Message | PartialMessage>, serverLog: TextChannel): Promise<void> {
	if (!('name' in messages[0].channel) || messages[0].guild.id !== GUILDS.MAIN) return;

	const [logEntry] = (await serverLog.guild.fetchAuditLogs({ type: 'MESSAGE_BULK_DELETE', limit: 1 })).entries.array();

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

			const edits = msg.edits.reverse();
			buffer += `Last displayed content of message ${msgIdx}:\n${edits.pop().content}\n\n`;

			edits.forEach((edit, editIdx) => {
				buffer += `Message ${msgIdx}, edit ${editIdx}\n${edit.content}\n\n`;
			});

			buffer = buffer.trim() + spacer;
		}
	});

	serverLog.send(new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`${messages.length} Message${messages.length === 1 ? '' : 's'} bulk deleted`)
		.setDescription(logEntry.reason ? `**Reason**\n${logEntry.reason}` : '')
		.attachFiles([new MessageAttachment(Buffer.from(buffer.slice(0, buffer.length - spacer.length).trim()), 'Messages.txt')])
		.setColor('ORANGE')
		.setFooter(`Deleter ID: ${logEntry.executor.id}`)
		.setTimestamp());
}

async function processRoleCreate(role: Role, serverLog: TextChannel): Promise<void> {
	if (role.guild.id !== GUILDS.MAIN) return;

	const [logEntry] = (await role.guild.fetchAuditLogs({ type: 'ROLE_CREATE', limit: 1 })).entries.array();

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
		value: role.permissions.bitfield !== 0
			? Permissions.ALL === role.permissions.bitfield
				? '`ALL`'
				: `\`${role.permissions.toArray().join('`, `')}\``
			: '`NONE`',
		inline: false
	});

	serverLog.send(new MessageEmbed()
		.setAuthor(`${logEntry.executor.tag}`, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Created new role @${role.name}`)
		.addFields(fields)
		.setFooter(`Role ID: ${role.id}`)
		.setColor('DARK_BLUE')
		.setTimestamp());
}

async function processRoleDelete(role: Role, serverLog: TextChannel): Promise<void> {
	if (role.guild.id !== GUILDS.MAIN) return;

	const [logEntry] = (await role.guild.fetchAuditLogs({ type: 'ROLE_DELETE', limit: 1 })).entries.array();

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	serverLog.send(new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`Deleted role @${role.name}`)
		.addFields(fields)
		.setFooter(`Role ID: ${role.id}`)
		.setColor('DARK_BLUE')
		.setTimestamp());
}

async function processRoleUpdate(oldRole: Role, newRole: Role, serverLog: TextChannel): Promise<void> {
	if (newRole.guild.id !== GUILDS.MAIN) return;

	const [logEntry] = (await newRole.guild.fetchAuditLogs({ type: 'ROLE_UPDATE', limit: 1 })).entries.array();
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
			newRole.permissions.bitfield !== 0
				? Permissions.ALL === newRole.permissions.bitfield
					? '`ALL`'
					: `\`${newRole.permissions.toArray().join('`, `')}\``
				: '`NONE`'
		);
	}

	if (toSend) {
		serverLog.send(embed);
	}
}

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(CHANNELS.ERROR_LOG) as TextChannel;
	const serverLog = await bot.channels.fetch(CHANNELS.SERVER_LOG) as TextChannel;

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

	bot.on('inviteCreate', invite => {
		processInviteCreate(invite, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('inviteDelete', invite => {
		processInviteDelete(invite, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('messageDelete', message => {
		processMessageDelete(message, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('messageDeleteBulk', messages => {
		processBulkDelete(messages.array().reverse(), serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('roleCreate', role => {
		processRoleCreate(role, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('roleDelete', role => {
		processRoleDelete(role, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});

	bot.on('roleUpdate', (oldRole, newRole) => {
		processRoleUpdate(oldRole, newRole, serverLog)
			.catch(async error => errLog.send(await generateLogEmbed(error)));
	});
}

export default register;
