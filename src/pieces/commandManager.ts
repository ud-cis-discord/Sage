import { Collection, Client, CommandInteraction, ApplicationCommand,
	GuildMember, Role, SelectMenuInteraction,
	ModalSubmitInteraction, TextChannel, GuildMemberRoleManager,
	ButtonInteraction, ModalBuilder, TextInputBuilder, ActionRowBuilder,
	ModalActionRowComponentBuilder, ApplicationCommandType, ApplicationCommandDataResolvable, ChannelType, ApplicationCommandPermissionType, TextInputStyle,
	ChatInputCommandInteraction } from 'discord.js';
import { generateErrorEmbed, isCmdEqual, readdirRecursive } from '@root/src/lib/utils/generalUtils';
import { HASH_LENGTH } from '@lib/utils/onboardUtils';
import { Command } from '@lib/types/Command';
import { SageData } from '@lib/types/SageData';
import { DB, GUILDS, MAINTAINERS, CHANNELS } from '@root/config';
import { Course } from '../lib/types/Course';
import { SageUser } from '../lib/types/SageUser';
import { CommandError } from '../lib/types/errors';
import { verify, VerifyResult } from '../pieces/verification';

const DELETE_DELAY = 10000;

async function register(bot: Client): Promise<void> {
	try {
		await loadCommands(bot);
	} catch (error) {
		bot.emit('error', error);
	}

	bot.on('messageCreate', async msg => {
		if (msg.content.substring(0, 2).toLowerCase().includes('s;')) {
			// eslint-disable-next-line max-len
			msg.reply(`If you're trying to run a Sage command, we've moved over to using slash commands. If you're trying to enroll in a course, please use the dropdowns in <#${CHANNELS.ROLE_SELECT}> instead!`)
				.then(reply => {
					// delete reply after 10 seconds
					setTimeout(() => { reply.delete(); }, DELETE_DELAY);
				});
			msg.delete();
		}
	});

	bot.on('interactionCreate', async interaction => {
		if (interaction.isChatInputCommand() || interaction.isContextMenuCommand()) runCommand(interaction as ChatInputCommandInteraction, bot);
		if (interaction.isSelectMenu()) handleDropdown(interaction).catch(error => bot.emit('error', error));
		if (interaction.isModalSubmit()) handleModalBuilder(interaction, bot).catch(error => bot.emit('error', error));
		if (interaction.isButton()) handleButton(interaction).catch(error => bot.emit('error', error));
	});

	bot.on('messageCreate', async msg => {
		const lcMessage = msg.content.toLowerCase();
		const thankCheck = (lcMessage.includes('thank') || lcMessage.includes('thx')) && lcMessage.includes(' sage');

		if (thankCheck) {
			msg.react('<:steve_peace:883541149032267816>');
		}
	});
}

async function handleDropdown(interaction: SelectMenuInteraction): Promise<void> {
	const { customId, values, member } = interaction;
	if (customId !== 'roleselect' || !(member instanceof GuildMember)) return;

	// Discord only gives us 3 seconds to acknowledge; defer before doing any DB or role API work
	await interaction.deferReply({ ephemeral: true });

	const courses: Array<Course> = await interaction.client.mongo.collection(DB.COURSES).find().toArray();
	const { component } = interaction;
	const removed = component.options.filter((option) => !values.includes(option.value));
	let responseContent = `Your roles have been updated.`;
	const addedRoleNames = [];
	const removedRoleNames = [];
	const staleOptions = [];
	const failedRoleNames = [];
	for (const option of removed) {
		const role = interaction.guild.roles.cache.get(option.value);
		if (!role) {
			// a role deleted from the server can linger as an option on a stale dropdown; skip it rather than fail the whole interaction
			staleOptions.push(option.label);
			continue;
		}
		if (!member.roles.cache.has(option.value)) continue; // does user have this role?
		const result = await toggleDropdownRole(interaction, member, courses, role, false);
		if (result === 'failed') {
			failedRoleNames.push(role.name);
			continue;
		}
		removedRoleNames.push(role.name);
		responseContent = `Your enrollments have been updated.`;
	}
	for (const id of values) {
		const role = interaction.guild.roles.cache.get(id);
		if (!role) {
			staleOptions.push(component.options.find(option => option.value === id)?.label || id);
			continue;
		}
		if (member.roles.cache.has(id)) continue; // does user not have this role?
		const result = await toggleDropdownRole(interaction, member, courses, role, true);
		if (result === 'failed') {
			failedRoleNames.push(role.name);
			continue;
		}
		if (result === 'enrollment') responseContent = `Your enrollments have been updated.`;
		addedRoleNames.push(role.name);
	}
	if (staleOptions.length !== 0) {
		interaction.client.emit('error', new Error(`roleselect: dropdown has stale option(s) pointing at deleted roles: ${staleOptions.join(', ')}`));
	}
	await interaction.editReply({
		content: `${responseContent} The following changes have been applied to your roles:
		${addedRoleNames.length !== 0 ? `**Added: **${addedRoleNames.join(', ')}\n\t\t\t` : ''}${removedRoleNames.length !== 0 ? `**Removed: **${removedRoleNames.join(', ')}` : ''}${
	staleOptions.length !== 0 ? `\n\t\t\tThe following options couldn't be processed because their roles no longer exist: ${staleOptions.join(', ')}. ${MAINTAINERS} have been notified.` : ''}${
	failedRoleNames.length !== 0 ? `\n\t\t\tThe following role changes couldn't be applied: ${failedRoleNames.join(', ')}. ${MAINTAINERS} have been notified.` : ''}`
	});
}

// Adds or removes one dropdown role (and, for course roles, the DB enrollment bookkeeping) for a member.
// 'enrollment' = a course change was applied, 'role' = a plain role change was applied, 'failed' = the Discord role change didn't go through.
async function toggleDropdownRole(interaction: SelectMenuInteraction, member: GuildMember, courses: Array<Course>, role: Role, adding: boolean): Promise<'enrollment' | 'role' | 'failed'> {
	// a CISC role can outlive its course document (e.g. archived courses); fall back to a plain role toggle then
	const course = role.name.includes('CISC') ? courses.find(c => c.name === role.name.substring(5)) : null;
	let roleOpFailed = false;
	const onRoleOpError = (error: Error) => {
		roleOpFailed = true;
		interaction.client.emit('error', error);
	};
	// change the Discord roles first so the DB and the reply only ever record changes that actually happened
	if (course) {
		if (adding) await member.roles.add(course.roles.student, `Enrolled in ${course.name}.`).catch(onRoleOpError);
		else await member.roles.remove(course.roles.student, `Unenrolled from ${course.name}.`).catch(onRoleOpError);
	}
	if (adding) await member.roles.add(role.id).catch(onRoleOpError);
	else await member.roles.remove(role.id).catch(onRoleOpError);
	if (roleOpFailed) return 'failed';
	if (!course) return 'role';

	const user: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: member.id });
	if (user) {
		user.courses = adding ? [...user.courses, course.name] : user.courses.filter(c => c !== course.name);
		await interaction.client.mongo.collection(DB.USERS).updateOne({ discordId: member.id }, { $set: { ...user } })
			.catch(error => interaction.client.emit('error', error));
	} else {
		interaction.client.emit('error', new Error(`roleselect: no SageUser found for ${member.id} while ${adding ? 'enrolling in' : 'unenrolling from'} CISC ${course.name}`));
	}
	return 'enrollment';
}

async function handleModalBuilder(interaction: ModalSubmitInteraction, bot: Client) {
	const { customId, fields } = interaction;

	switch (customId) {
		case 'announce': {
			const channel = bot.channels.cache.get(fields.getTextInputValue('channel')) as TextChannel;
			const content = fields.getTextInputValue('content');
			const file = fields.getTextInputValue('file');
			await channel.send({
				content: content,
				files: file !== '' ? [file] : null,
				allowedMentions: { parse: ['everyone', 'roles'] }
			});
			interaction.reply({ content: `Your announcement was posted in ${channel}.` });
			break;
		}
		case 'edit': {
			const content = fields.getTextInputValue('content');
			const channel = bot.channels.cache.get(fields.getTextInputValue('channel')) as TextChannel;
			const message = await channel.messages.fetch(fields.getTextInputValue('message'));
			await message.edit(content);
			interaction.reply({ content: `Your message was edited.` });
			break;
		}
		case 'verify': {
			await handleVerifyModal(interaction, bot);
			break;
		}
	}
}

async function handleVerifyModal(interaction: ModalSubmitInteraction, bot: Client): Promise<void> {
	// Discord only gives us 3 seconds to acknowledge; defer before doing any DB or role API work
	await interaction.deferReply({ ephemeral: true });
	try {
		// hashes copied out of the email often pick up stray spaces/newlines; the code itself never contains whitespace
		const givenHash = interaction.fields.getTextInputValue('verifyPrompt').replace(/\s+/g, '');
		if (givenHash.length !== HASH_LENGTH) {
			await interaction.editReply({ embeds: [generateErrorEmbed(`That doesn't look like a hash code. Please paste only the ${HASH_LENGTH}-character code from your verification email,` +
				' exactly as shown (it is case-sensitive).')] });
			return;
		}

		const entry: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ hash: givenHash });
		if (!entry) {
			await interaction.editReply({ embeds: [generateErrorEmbed('I could not find that hash code in the database. Please copy and paste the code from your verification email' +
				` exactly as shown — it is case-sensitive, and it is the same code in every email you have received from us. If it still doesn't work, contact ${MAINTAINERS}.`)] });
			return;
		}

		const guild = await bot.guilds.fetch(GUILDS.MAIN);
		const result: VerifyResult = await verify(interaction, bot, guild, entry, givenHash);
		const enrollStr = entry.courses.length > 0
			? ` You have been automatically enrolled in CISC ${entry.courses[0]}. To enroll in more courses or to unenroll from your current course,` +
			` go to <#${CHANNELS.ROLE_SELECT}> and use the proper dropdown menu.`
			: '';
		switch (result) {
			case 'verified':
				await interaction.editReply({ content: `Thank you for verifying! You can now access the rest of the server.${enrollStr}` });
				break;
			case 'reverified':
				await interaction.editReply({ content: 'You were already verified with this account, so I\'ve re-applied your roles.' +
					` You should be able to access the rest of the server.${enrollStr}` });
				break;
			case 'claimedByOther':
				await interaction.editReply({ embeds: [generateErrorEmbed('That hash code has already been used to verify a different Discord account.' +
					` If that account is yours, please log in with it instead; otherwise contact ${MAINTAINERS}.`)] });
				break;
			case 'notInGuild':
				await interaction.editReply({ embeds: [generateErrorEmbed('I couldn\'t find you in the main server. Please join it using the link in your verification email, then press Verify again.')] });
				break;
			case 'roleAddFailed':
				await interaction.editReply({ embeds: [generateErrorEmbed('You\'re verified in our records, but I couldn\'t assign your roles.' +
					` ${MAINTAINERS} have been notified — please press Verify again in a minute.`)] });
				break;
		}
	} catch (error) {
		bot.emit('error', error);
		await interaction.editReply({ embeds: [generateErrorEmbed(`Something went wrong while verifying you. ${MAINTAINERS} have been notified; please try again in a minute.`)] }).catch(() => undefined);
	}
}

export async function handleButton(interaction: ButtonInteraction): Promise<void> {
	const { customId } = interaction;

	switch (customId) {
		case 'verify': {
			const verifyModal = new ModalBuilder()
				.setTitle('User Verification')
				.setCustomId('verify');
			const verifyPrompt = new TextInputBuilder()
				.setCustomId('verifyPrompt')
				.setLabel('Please enter your unique hash code here:')
				.setStyle(TextInputStyle.Short)
				// wider than the hash itself so a pasted code with stray whitespace can still be submitted and trimmed server-side
				.setMaxLength(HASH_LENGTH * 2)
				.setRequired(true);
			const verifyActionRow = new ActionRowBuilder<ModalActionRowComponentBuilder>().addComponents(verifyPrompt);

			verifyModal.addComponents(verifyActionRow);

			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore - apparently doesn't exist, but if i ignore it it works!
			await interaction.showModal(verifyModal);
		}
	}
}

export async function loadCommands(bot: Client): Promise<void> {
	bot.commands = new Collection();
	const sageData = await bot.mongo.collection(DB.CLIENT_DATA).findOne({ _id: bot.user.id }) as SageData;
	const oldCommandSettings = sageData?.commandSettings || [];
	await bot.guilds.cache.get(GUILDS.MAIN).commands.fetch();
	const { commands } = bot.guilds.cache.get(GUILDS.MAIN);
	let numNew = 0, numEdited = 0;

	const commandFiles = readdirRecursive(`${__dirname}/../commands`).filter(file => file.endsWith('.js'));

	const awaitedCmds: Promise<ApplicationCommand>[] = [];

	for (const file of commandFiles) {
		const commandModule = await import(file);

		const dirs = file.split('/');
		const name = dirs[dirs.length - 1].split('.')[0];

		// semi type-guard, typeof returns function for classes
		if (!(typeof commandModule.default === 'function')) {
			console.log(`Invalid command ${name}`);
			continue;
		}

		// eslint-disable-next-line new-cap
		const command: Command = new commandModule.default;

		command.name = name;

		if ((!command.description || command.description.length >= 100 || command.description.length <= 0) && (command.type === ApplicationCommandType.ChatInput)) {
			throw `Command ${command.name}'s description must be between 1 and 100 characters.`;
		}

		command.category = dirs[dirs.length - 2];

		const guildCmd = commands.cache.find(cmd => cmd.name === command.name);

		const cmdData = {
			name: command.name,
			description: command.description,
			options: command?.options || [],
			type: command.type || ApplicationCommandType.ChatInput,
			defaultPermission: false
		} as ApplicationCommandDataResolvable;

		if (!guildCmd) {
			awaitedCmds.push(commands.create(cmdData));
			numNew++;
			console.log(`${command.name} does not exist, creating...`);
			// eslint-disable-next-line @typescript-eslint/ban-ts-comment
			// @ts-ignore: guildCmd's typing wasn't properly infered, throws a gigantic error I'm not even going to *try* to understand.
		} else if (!isCmdEqual(cmdData, guildCmd)) {
			awaitedCmds.push(commands.edit(guildCmd.id, cmdData));
			numEdited++;
			console.log(`a different version of ${command.name} already exists, editing...`);
		}

		const oldSettings = oldCommandSettings.find(cmd => cmd.name === command.name);
		let enable: boolean;
		if (oldSettings) {
			enable = oldSettings.enabled;
		} else {
			enable = command.enabled !== false;
			oldCommandSettings.push({ name: command.name, enabled: enable });
		}
		command.enabled = enable;

		bot.commands.set(name, command);

		bot.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: bot.user.id },
			{ $set: { commandSettings: oldCommandSettings } },
			{ upsert: true }
		);
	}

	await Promise.all(awaitedCmds);

	console.log(`${bot.commands.size} commands loaded (${numNew} new, ${numEdited} edited).`);
}

async function runCommand(interaction: ChatInputCommandInteraction, bot: Client): Promise<unknown> {
	const command = bot.commands.get(interaction.commandName);

	if (interaction.channel.type === ChannelType.GuildText && command.runInGuild === false) {
		return interaction.reply({
			content: 'This command must be run in DMs, not public channels',
			ephemeral: true
		});
	}

	if (bot.commands.get(interaction.commandName).run !== undefined) {
		let success = false;
		for (const user of command.permissions) {
			if (user.id === interaction.user.id && user.type === ApplicationCommandPermissionType.User) { // the user is able to use this command (most likely admin-only)
				success = true;
				break;
			}
			if (user.type === ApplicationCommandPermissionType.Role) {
				// says these parens are unneeded, but removing them breaks this line, so
				// eslint-disable-next-line no-extra-parens
				if ((interaction.member.roles as GuildMemberRoleManager).cache.find(role => role.id === user.id)) {
					success = true;
					break;
				}
			}
		}

		const failMessages = ['HTTP 401: Unauthorized', `I'm sorry ${interaction.user.username}, I'm afraid I can't do that.`,
			'Username is not in the sudoers file. This incident will be reported.', `I'm sorry ${interaction.user.username}, but you need sigma nine clearance for that.`];
		if (!success) return interaction.reply(failMessages[Math.floor(Math.random() * failMessages.length)]);

		try {
			bot.commands.get(interaction.commandName).run(interaction)
				?.catch(async (error: Error) => { // Idk if this is needed now, but keeping in case removing it breaks stuff...
					bot.emit('error', new CommandError(error, interaction));
					interaction.reply({ content: `An error occurred. ${MAINTAINERS} have been notified.`, ephemeral: true });
				});
		} catch (error) {
			bot.emit('error', new CommandError(error, interaction));
			interaction.reply({ content: `An error occurred. ${MAINTAINERS} have been notified.`, ephemeral: true });
			console.log(error.errors);
		}
	}
}

export default register;
