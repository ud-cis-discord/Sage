import { ApplicationCommandOptionData, CommandInteraction, EmbedField, MessageEmbed, Util, GuildMember } from 'discord.js';
import { getCommand } from '@lib/utils';
import { BOT, PREFIX } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Provides info about all ${BOT.NAME} commands`;
	extendedHelp = 'If given no arguments, a list of all commands you have access to will be sent to your DMs';

	options: ApplicationCommandOptionData[] = [
		{
			name: 'cmd',
			description: 'command you would like to know more about',
			type: 'STRING',
			required: false
		}
	]

	async run(interaction: CommandInteraction): Promise<void> {
		const cmd = interaction.options.getString('cmd');
		const { commands } = interaction.client;
		const website = 'https://ud-cis-discord.github.io/pages/commands';

		if (cmd) {
			const command = getCommand(interaction.client, cmd);
			if (!command) {
				return interaction.reply({ content: `**${cmd}** is not a valid command.`, ephemeral: true });
			}

			const fields: Array<EmbedField> = [];

			if (command.extendedHelp) {
				fields.push({
					name: 'Extended Help',
					value: command.extendedHelp,
					inline: false
				});
			}

			if (command.options) {
				fields.push({
					name: 'Parameters',
					value: command.options.map(param =>
						`**${param.name}** (${param.required ? 'required' : 'optional'}): ${param.description}`
					).join('\n'),
					inline: false
				});
			}

			fields.push({
				name: 'More commands',
				value: `[Visit our website!](${website})`,
				inline: false
			});

			const embed = new MessageEmbed()
				.setTitle(command.name)
				.setDescription(command.description ? command.description : '')
				.addFields(fields)
				.setThumbnail(interaction.client.user.avatarURL())
				.setTimestamp(Date.now())
				.setColor('RANDOM');

			return interaction.reply({ embeds: [embed] });
		} else {
			// if no command given
			let helpStr = `You can do \`/help <command>\` to get more information about any command, or you can visit our website here:\n<${website}>\n`;
			const categories: Array<string> = [];
			commands.forEach(command => {
				if (!categories.includes(command.category)) categories.push(command.category);
			});

			const member = interaction.member as GuildMember;
			const staff = interaction.guild.roles.cache.find(r => r.name === 'Staff');
			const admin = interaction.guild.roles.cache.find(r => r.name === 'admin');
			categories.forEach(cat => {
				let useableCmds = commands.filter(command =>
					command.category === cat
					&& command.enabled !== false);
				// check if user isn't admin and filter accordingly
				if (!member.roles.cache.has(admin.id)) {
					useableCmds = useableCmds.filter(command => command.category !== 'admin');
				}
				// check if user isn't staff and filter accordingly
				if (!member.roles.cache.has(staff.id)) {
					useableCmds = useableCmds.filter(command => command.category !== 'staff' && command.category !== 'admin');
				}
				const categoryName = cat === 'commands' ? 'General' : `${cat[0].toUpperCase()}${cat.slice(1)}`;
				if (useableCmds.size > 0) {
					helpStr += `\n**${categoryName} Commands**\n`;
					useableCmds.forEach(command => {
						helpStr += `\`${PREFIX}${command.name}\` ⇒ ${command.description ? command.description : 'No description provided'}\n`;
					});
				}
			});

			const splitStr = Util.splitMessage(helpStr, { char: '\n' });

			let notified = false;
			splitStr.forEach((helpMsg) => {
				const embed = new MessageEmbed()
					.setTitle(`-- Commands --`)
					.setDescription(helpMsg)
					.setColor('RANDOM');
				interaction.user.send({ embeds: [embed] })
					.then(() => {
						if (!notified) {
							if (interaction.channel.type !== 'DM') interaction.reply({ content: 'I\'ve sent all commands to your DMs.', ephemeral: true });
							notified = true;
						}
					})
					.catch(() => {
						if (!notified) {
							interaction.reply({ content: 'I couldn\'t send you a DM. Please enable DMs and try again.', ephemeral: true });
							notified = true;
						}
					});
			});
		}
	}

}
