import { EmbedField, Message, MessageEmbed } from 'discord.js';
import { getCommand } from '@lib/utils';
import { BOT, PREFIX } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Provides info about all ${BOT.NAME} commands`;
	usage = '[command]';
	extendedHelp = 'If given no arguments, a list of all commands you have access to will be sent to your DMs';
	aliases = ['commands', 'man', 'h'];

	run(msg: Message, [cmd]: [string]): Promise<Message | void> {
		const { commands } = msg.client;
		const website = 'https://ud-cis-discord.github.io/pages/commands';
		if (cmd) {
			const command = getCommand(msg.client, cmd);
			if (!command) return msg.channel.send(`**${cmd}** is not a valid command.`);

			const fields: Array<EmbedField> = [];
			fields.push({
				name: 'Usage',
				value: `${PREFIX}${command.name} ${command.usage ? command.usage : ''}`,
				inline: true
			});
			if (command.aliases) {
				fields.push({
					name: 'Aliases',
					value: command.aliases.join(', '),
					inline: true
				});
			}
			if (command.extendedHelp) {
				fields.push({
					name: 'Extended Help',
					value: command.extendedHelp,
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
				.setThumbnail(msg.client.user.avatarURL())
				.setTimestamp(Date.now())
				.setColor('RANDOM');

			return msg.channel.send({ embeds: [embed] });
		} else {
			let helpStr = `You can do \`${PREFIX}help <command>\` to get more information about any command, or you can visit our website here:\n<${website}>\n`;
			const categories: Array<string> = [];
			commands.forEach(command => {
				if (!categories.includes(command.category)) categories.push(command.category);
			});

			categories.forEach(cat => {
				const useableCmds = commands.filter(command =>
					command.category === cat
					&& !(command.permissions && !command.permissions(msg))
					&& command.enabled !== false);
				const categoryName = cat === 'commands' ? 'General' : `${cat[0].toUpperCase()}${cat.slice(1)}`;
				if (useableCmds.size > 0) {
					helpStr += `\n**${categoryName} Commands**\n`;
					useableCmds.forEach(command => {
						helpStr += `\`${PREFIX}${command.name}\` ⇒ ${command.description ? command.description : 'No decirption provided'}\n`;
					});
				}
			});

			msg.author.send(helpStr, { split: { char: '\n' } })
				.then(() => { if (msg.channel.type !== 'DM') msg.channel.send('I\'ve sent all commands to your DMs'); })
				.catch(() => msg.channel.send('I couldnt send you a DM. Please enable DMs and try again'));
		}
	}

}
