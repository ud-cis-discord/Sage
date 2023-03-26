import { Client, GuildMember, TextChannel, EmbedBuilder, PartialGuildMember, EmbedField, User, PartialUser, AuditLogEvent } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { GUILDS, CHANNELS } from '@root/config';

async function processMemberAdd(member: GuildMember, channel: TextChannel): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN) return;

	const embed = new EmbedBuilder()
		.setTitle(`${member.user.tag} just joined.`)
		.setThumbnail(member.user.avatarURL())
		.addFields({ name: 'Account created', value: `${member.user.createdAt.toLocaleString()}, ` +
			`${prettyMilliseconds(Date.now() - member.user.createdTimestamp, { verbose: true })} ago` })
		.setColor('Aqua')
		.setFooter({ text: `Discord ID: ${member.id}` })
		.setTimestamp();
	channel.send({ embeds: [embed] });
}

async function processMemberRemove(member: GuildMember | PartialGuildMember, channel: TextChannel): Promise<void> {
	if (member.guild.id !== GUILDS.MAIN) return;

	const fields: Array<EmbedField> = [];

	if (member.user.createdAt) {
		fields.push({
			name: 'Account created',
			value: `${member.user.createdAt.toLocaleString()}, ${prettyMilliseconds(Date.now() - member.user.createdTimestamp, { verbose: true })} ago`,
			inline: false
		});
	} else {
		fields.push({
			name: 'Account created',
			value: 'User not cached, timestamp unknown.',
			inline: false
		});
	}

	if (member.joinedAt) {
		fields.push({
			name: 'User joined',
			value: `${member.joinedAt.toLocaleString()}, ${prettyMilliseconds(Date.now() - member.joinedTimestamp, { verbose: true })} ago`,
			inline: false
		});
	} else {
		fields.push({
			name: 'User joined',
			value: 'User not cached, timestamp unknown.',
			inline: false
		});
	}

	if (member.roles.cache) {
		fields.push({
			name: 'Roles',
			value: member.roles.cache.size > 1
				? member.roles.cache.filter(role => role.id !== GUILDS.MAIN).map(role => role.toString()).join(', ')
				: 'None',
			inline: false
		});
	} else {
		fields.push({
			name: 'Roles',
			value: 'User not cached, timestamp unknown.',
			inline: false
		});
	}

	const embed = new EmbedBuilder()
		.setTitle(`${member.user.tag} just left.`)
		.setThumbnail(member.user.avatarURL())
		.addFields(fields)
		.setColor('DarkOrange')
		.setFooter({ text: `Discord ID: ${member.id}` })
		.setTimestamp();
	channel.send({ embeds: [embed] });
}

async function processMemberUpdate(oldMember: GuildMember | PartialGuildMember, newMember: GuildMember, channel: TextChannel): Promise<void> {
	if (newMember.guild.id !== GUILDS.MAIN) return;
	const embed = new EmbedBuilder()
		.setFooter({ text: `Discord ID: ${newMember.id}` })
		.setTimestamp();
	let toSend = false;

	if (!toSend && oldMember.displayName !== newMember.displayName) {
		toSend = true;
		embed.setAuthor({ name: `${newMember.user.tag} changed their nickname.`, iconURL: newMember.user.avatarURL() })
			.addFields([
				{
					name: 'New nickname',
					value: newMember.displayName,
					inline: true
				}, {
					name: 'Old nickname',
					value: oldMember.displayName,
					inline: true
				}
			])
			.setColor('DarkPurple');
	}

	if (!toSend && !oldMember.roles.cache.equals(newMember.roles.cache)) {
		toSend = true;

		const updateType = oldMember.roles.cache.size > newMember.roles.cache.size
			? 'removed from'
			: 'added to';

		let updatedRole = newMember.roles.cache.find(role => !oldMember.roles.cache.has(role.id));
		if (!updatedRole) {
			updatedRole = oldMember.roles.cache.find(role => !newMember.roles.cache.has(role.id));
		}

		const logEntries = await newMember.guild.fetchAuditLogs({ type: AuditLogEvent.MemberRoleUpdate, limit: 15 });
		const logEntry = logEntries.entries.find(entry => {
			if (!('id' in entry.target)) return false;
			if (entry.changes[0].new[0].id !== updatedRole.id) return false;
			if (entry.target.id !== newMember.id) return false;
			return true;
		});

		const fields: Array<EmbedField> = [{
			name: 'Moderator',
			value: logEntry
				? `${logEntry.executor.tag} (${logEntry.executor.id})`
				: 'Moderator not found, check audit log manually if needed.',
			inline: true
		}];

		if (logEntry?.reason) {
			fields.push({
				name: 'With reason',
				value: logEntry.reason,
				inline: true
			});
		}

		embed.setAuthor({ name: `${newMember.user.tag} was ${updateType} the ${updatedRole.name} role`, iconURL: newMember.user.avatarURL() })
			.addFields(fields)
			.setColor('Navy');
	}

	if (toSend) {
		channel.send({ embeds: [embed] });
	}
}

async function processUserUpdate(oldUser: User | PartialUser, newUser: User, channel: TextChannel): Promise<void> {
	let toSend = false;
	const embed = new EmbedBuilder()
		.setAuthor({ name: newUser.tag, iconURL: newUser.avatarURL() })
		.setColor('DarkGold')
		.setFooter({ text: `Discord ID: ${newUser.id}` })
		.setTimestamp();

	if (!toSend && oldUser.tag !== newUser.tag) {
		toSend = true;
		embed.setTitle(`${oldUser.tag} changed their tag to ${newUser.tag}`);
	}

	if (!toSend && oldUser.avatar !== newUser.avatar) {
		toSend = true;
		embed.setTitle(`${newUser.tag} changed their pfp`)
			.setDescription('↓ New pfp ↓ | Old pfp →')
			.setImage(newUser.avatarURL())
			.setThumbnail(oldUser.avatarURL());
	}

	if (toSend) {
		channel.send({ embeds: [embed] });
	}
}

async function register(bot: Client): Promise<void> {
	const memLog = await bot.channels.fetch(CHANNELS.MEMBER_LOG) as TextChannel;

	bot.on('guildMemberAdd', member => {
		processMemberAdd(member, memLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('guildMemberRemove', member => {
		processMemberRemove(member, memLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('guildMemberUpdate', (oldMember, newMember) => {
		processMemberUpdate(oldMember, newMember, memLog)
			.catch(async error => bot.emit('error', error));
	});

	bot.on('userUpdate', (oldUser, newUser) => {
		processUserUpdate(oldUser, newUser, memLog)
			.catch(async error => bot.emit('error', error));
	});
}

export default register;
