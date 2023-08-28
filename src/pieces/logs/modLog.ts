import { Client, TextChannel, EmbedField, EmbedBuilder, GuildMember, PartialGuildMember, GuildBan, AuditLogEvent } from 'discord.js';
import { GUILDS, CHANNELS, ROLES } from '@root/config';

async function processBanAdd(ban: GuildBan, modLog: TextChannel): Promise<void> {
	const { guild, user } = ban;
	if (guild.id !== GUILDS.MAIN) return;

	const logs = (await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanAdd, limit: 1 })).entries;
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
		.setTitle(`${user.tag} was banned.`)
		.addFields(fields)
		.setColor('Greyple')
		.setFooter({ text: `Mod ID: ${logEntry.executor.id} | Target ID: ${user.id}` })
		.setTimestamp();
	modLog.send({ embeds: [embed] });
}

async function processBanRemove(ban: GuildBan, modLog: TextChannel): Promise<void> {
	const { guild, user } = ban;
	if (ban.guild.id !== GUILDS.MAIN) return;

	const logs = (await guild.fetchAuditLogs({ type: AuditLogEvent.MemberBanRemove, limit: 1 })).entries;
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
		.setTitle(`${user.tag} was unbanned.`)
		.addFields(fields)
		.setColor('Greyple')
		.setFooter({ text: `Mod ID: ${logEntry.executor.id} | Target ID: ${user.id}` })
		.setTimestamp();
	modLog.send({ embeds: [embed] });
}

async function processMemberUpdate(oldMember: GuildMember | PartialGuildMember, member: GuildMember, modLog: TextChannel): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN || oldMember.roles.cache.equals(member.roles.cache)) return;

	const logs = (await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 5 })).entries;
	const logEntry = [...logs.values()].find(entry => {
		if (!('id' in entry.target)) return false;
		return entry.target.id === member.id;
	});

	if (!logEntry) return;

	let muted: 'muted' | 'unmuted' | null = null;

	if (logEntry.changes.find(change => change.key === '$add')?.new[0]?.id === ROLES.MUTED) {
		muted = 'muted';
	} else if (logEntry.changes.find(change => change.key === '$remove')?.new[0]?.id === ROLES.MUTED) {
		muted = 'unmuted';
	}

	if (muted !== null) {
		const embed = new EmbedBuilder()
			.setTitle(`${member.user.tag} ${muted} by ${logEntry.executor.tag}`)
			.setDescription(logEntry.reason ? `With reason: \n${logEntry.reason}` : '')
			.setColor('DarkRed')
			.setFooter({ text: `TargetID: ${member.id} | Mod ID: ${logEntry.executor.id}` })
			.setTimestamp();
		modLog.send({ embeds: [embed] });
	}
}

async function processMemberRemove(member: GuildMember | PartialGuildMember, modLog: TextChannel): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN) return;

	const logs = (await member.guild.fetchAuditLogs({ type: AuditLogEvent.MemberKick, limit: 1 })).entries;
	const [logEntry] = [...logs.values()];
	if (!logEntry) return;

	if (!('id' in logEntry.target)
		|| logEntry.target.id !== member.id
		|| (Date.now() - logEntry.createdTimestamp) > 10e3) return;

	const embed = new EmbedBuilder()
		.setTitle(`${member.user.tag} kicked by ${logEntry.executor.tag}`)
		.setDescription(logEntry.reason ? `With reason: \n${logEntry.reason}` : '')
		.setColor('Yellow')
		.setFooter({ text: `TargetID: ${member.id} | Mod ID: ${logEntry.executor.id}` })
		.setTimestamp();
	modLog.send({ embeds: [embed] });
}

async function register(bot: Client): Promise<void> {
	const modLog = await bot.channels.fetch(CHANNELS.MOD_LOG) as TextChannel;

	bot.on('guildBanAdd', ban => {
		processBanAdd(ban, modLog).catch(async error => bot.emit('error', error));
		return;
	});

	bot.on('guildBanRemove', ban => {
		processBanRemove(ban, modLog).catch(async error => bot.emit('error', error));
		return;
	});

	bot.on('guildMemberUpdate', (oldMember, newMember) => {
		processMemberUpdate(oldMember, newMember, modLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('guildMemberRemove', member => {
		processMemberRemove(member, modLog)
			.catch(async error => bot.emit('error', error));
	});
}

export default register;
