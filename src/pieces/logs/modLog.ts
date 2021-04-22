import { Client, TextChannel, Guild, User, EmbedField, MessageEmbed, GuildMember, PartialGuildMember } from 'discord.js';
import { GUILDS, CHANNELS, ROLES } from '@root/config';

async function processBanAdd(guild: Guild, target: User, modLog: TextChannel): Promise<void> {
	if (guild.id !== GUILDS.MAIN) return;

	const [logEntry] = (await guild.fetchAuditLogs({ type: 'MEMBER_BAN_ADD', limit: 1 })).entries.array();

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	modLog.send(new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`${target.tag} was banned.`)
		.addFields(fields)
		.setColor('GREYPLE')
		.setFooter(`Mod ID: ${logEntry.executor.id} | Target ID: ${target.id}`)
		.setTimestamp());
}

async function processBanRemove(guild: Guild, target: User, modLog: TextChannel): Promise<void> {
	if (guild.id !== GUILDS.MAIN) return;

	const [logEntry] = (await guild.fetchAuditLogs({ type: 'MEMBER_BAN_REMOVE', limit: 1 })).entries.array();

	const fields: Array<EmbedField> = [];

	if (logEntry.reason) {
		fields.push({
			name: 'Reason',
			value: logEntry.reason,
			inline: false
		});
	}

	modLog.send(new MessageEmbed()
		.setAuthor(logEntry.executor.tag, logEntry.executor.avatarURL({ dynamic: true }))
		.setTitle(`${target.tag} was unbanned.`)
		.addFields(fields)
		.setColor('GREYPLE')
		.setFooter(`Mod ID: ${logEntry.executor.id} | Target ID: ${target.id}`)
		.setTimestamp());
}

async function processMemberUpdate(oldMember: GuildMember | PartialGuildMember, member: GuildMember, modLog: TextChannel): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN || oldMember.roles.cache.equals(member.roles.cache)) return;

	const logEntries = (await member.guild.fetchAuditLogs({ type: 'MEMBER_ROLE_UPDATE', limit: 5 })).entries.array();
	const logEntry = logEntries.find(entry => {
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
		modLog.send(new MessageEmbed()
			.setTitle(`${member.user.tag} ${muted} by ${logEntry.executor.tag}`)
			.setDescription(logEntry.reason ? `With reason: \n${logEntry.reason}` : '')
			.setColor('DARK_RED')
			.setFooter(`TargetID: ${member.id} | Mod ID: ${logEntry.executor.id}`)
			.setTimestamp());
	}
}

async function processMemberRemove(member: GuildMember | PartialGuildMember, modLog: TextChannel): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN) return;

	const [logEntry] = (await member.guild.fetchAuditLogs({ type: 'MEMBER_KICK', limit: 1 })).entries.array();
	if (!logEntry) return;

	if (!('id' in logEntry.target)
		|| logEntry.target.id !== member.id
		|| (Date.now() - logEntry.createdTimestamp) > 10e3) return;

	modLog.send(new MessageEmbed()
		.setTitle(`${member.user.tag} kicked by ${logEntry.executor.tag}`)
		.setDescription(logEntry.reason ? `With reason: \n${logEntry.reason}` : '')
		.setColor('YELLOW')
		.setFooter(`TargetID: ${member.id} | Mod ID: ${logEntry.executor.id}`)
		.setTimestamp());
}

async function register(bot: Client): Promise<void> {
	const modLog = await bot.channels.fetch(CHANNELS.MOD_LOG) as TextChannel;

	bot.on('guildBanAdd', (guild, target) => {
		processBanAdd(guild, target, modLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('guildBanRemove', (guild, target) => {
		processBanRemove(guild, target, modLog)
			.catch(async error => bot.emit('error', error));
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
