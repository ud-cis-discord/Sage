import { EmbedField, Message, MessageEmbed } from 'discord.js';
import { SageClient } from '@lib/types/SageClient'
import { BOT, PREFIX } from '@root/config';
import { getCommand } from '@lib/utils';

export const decription = `Provides info about all ${BOT.NAME} commands`;
export const useage = '[command]';
export const extendedHelp = 'If given no arguments, a list of all commands you have access to will be sent to your DMs';
export const aliases = ['commands']

export function run(msg: Message, [cmd]: [string]): Promise<Message | void> {
	const { commands } = msg.client as SageClient
	if (cmd) {
		const command = getCommand(msg.client as SageClient, cmd);
		if (!command) return msg.channel.send(`**${cmd}** is not a valid command.`) 

		const fields: Array<EmbedField> = [];
		fields.push({
			name: 'Useage',
			value: `${PREFIX}${command.name} ${command.useage? command.useage: ''}`,
			inline: true
		});
		if (command.aliases) {
			fields.push({
				name: 'Aliases',
				value: command.aliases.join(', '),
				inline: true
			})
		}
		if (command.extendedHelp) {
			fields.push({
				name: 'Exteneded Help',
				value: command.extendedHelp,
				inline: false
			})
		}

		const embed = new MessageEmbed()
			.setTitle(command.name)
			.setDescription(command.decription ? command.decription: '')
			.addFields(fields)
			.setThumbnail(msg.client.user.avatarURL())
			.setTimestamp(Date.now())
			.setColor('RANDOM')
		return msg.channel.send(embed);
	} else {
		let helpStr = `You can do \`${PREFIX}help <command>\` to get more information about any command.\n`;
		const categories: Array<string> = [];
		commands.forEach(command => {
			if (!categories.includes(command.category)) categories.push(command.category);
		})
		
		categories.forEach(cat => {
			helpStr += `\n**${cat[0].toUpperCase()}${cat.slice(1)} Commands**\n`
			commands.filter(command => command.category === cat).forEach(command => {
				helpStr += `\`${PREFIX}${command.name}\` ⇒ ${command.decription ? command.decription: 'No decirption provided'}\n`
			})
		})

		msg.author.send(helpStr, {split: { char: '\n' }})
			.then(() => { if(msg.channel.type !== 'dm') msg.channel.send('I\'ve sent all commands to your DMs')})
			.catch(() => msg.channel.send('I couldnt send you a DM. Please enable DMs and try again'));
	}
}
