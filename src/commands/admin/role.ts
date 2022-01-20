import { TextChannel, Message, ApplicationCommandOptionData, CommandInteraction, MessageEmbed, MessageActionRow,
	MessageSelectOptionData, MessageSelectMenu, Client, Interaction, GuildMember } from 'discord.js';
import { Command } from '@lib/types/Command';
import { BOT } from '@root/config';

const modes = ['Add', 'Remove'];

export default class extends Command {

	description = `Add/remove a role to a message's role dropdown`;
	usage = '<messageID> | <channel> | <mode> | <role>';

	options: ApplicationCommandOptionData[] = [
		{
			name: 'messageid',
			description: 'The message to add the role dropdown to',
			type: 'STRING',
			required: true
		},
		{
			name: 'channel',
			description: 'The channel your target message was sent in',
			type: 'CHANNEL',
			required: true
		},
		{
			name: 'mode',
			description: `Add or remove a role to this message's role dropdown?`,
			type: 'STRING',
			required: true,
			choices: modes.map((arg) => ({
				name: arg,
				value: arg
			}))
		},
		{
			name: 'role',
			description: 'The role to add/remove to the dropdown',
			type: 'ROLE',
			required: true
		}
	]

	run(_msg: Message): Promise<void> { return; }

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const channel = interaction.options.getChannel('channel') as TextChannel;
		if (!channel || channel.type !== 'GUILD_TEXT') {
			const responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Argument error')
				.setDescription(`You must tag a text channel.`);
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		}

		const role = interaction.options.getRole('role');
		if (!role) {
			const responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Argument error')
				.setDescription(`Unknown role.`);
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		}

		const msgId = interaction.options.getString('messageid');
		let targetMessage: Message;
		try {
			targetMessage = await channel.messages.fetch(msgId, {
				cache: true,
				force: true
			});
		} catch (error) {
			const responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Argument error')
				.setDescription(`Unknown message, make sure your channel and message ID are correct.`);
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		}
		if (!targetMessage) {
			const responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Argument error')
				.setDescription(`Unknown message, make sure your channel and message ID are correct.`);
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		}

		console.log(targetMessage.author.id);
		console.log(BOT.CLIENT_ID);
		if (targetMessage.author.id !== BOT.CLIENT_ID) {
			const responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Argument error')
				.setDescription(`You must tag a message that was sent by ${BOT.NAME} (me!).`);
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		}

		let row = targetMessage.components[0] as MessageActionRow;
		if (!row) {
			row = new MessageActionRow();
		}

		const option: MessageSelectOptionData[] = [{
			label: role.name,
			value: role.id
		}];

		const menu = row.components[0] as MessageSelectMenu;
		if (interaction.options.getString('mode') === 'Add') {
			if (menu) {
				for (let i = 0; i < menu.options.length; i++) {
					if (menu.options[i].value === option[0].value) {
						const responseEmbed = new MessageEmbed()
							.setColor('#ff0000')
							.setTitle('Argument error')
							.setDescription(`${role.name} is in this message's role select menu already.\nTrying to remove this role from the dropdown? Use /role with the 'Remove' mode instead of 'Add' mode.`);
						return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
					}
				}
				menu.addOptions(option);
				menu.setMaxValues(menu.options.length);
			} else {
				row.addComponents(
					new MessageSelectMenu()
						.setCustomId('roleselect')
						.setMinValues(0)
						.setMaxValues(1)
						.setPlaceholder('Select your role(s)')
						.addOptions(option)
				);
			}
			targetMessage.edit({
				components: [row]
			});

			const responseEmbed = new MessageEmbed()
				.setColor('#00ff00')
				.setTitle('Done!')
				.setDescription(`${role.name} has been added to that message's role select menu.`);
			return interaction.reply({ embeds: [responseEmbed] });
		} else {
			if (!menu) {
				const responseEmbed = new MessageEmbed()
					.setColor('#ff0000')
					.setTitle('Argument error')
					.setDescription(`This message does not have a role dropdown menu. You will need to create one using the /role command with 'Add' mode instead of 'Remove' mode.`);
				return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
			}

			for (let i = 0; i < menu.options.length; i++) {
				if (menu.options[i].value === option[0].value) {
					menu.spliceOptions(i, 1);
					menu.setMaxValues(menu.options.length);
					if (menu.options.length > 0) {
						targetMessage.edit({
							components: [row]
						});
					} else {
						targetMessage.edit({
							components: []
						});
					}
					const responseEmbed = new MessageEmbed()
						.setColor('#00ff00')
						.setTitle('Done!')
						.setDescription(`${role.name} has been removed from that message's role select menu.`);
					return interaction.reply({ embeds: [responseEmbed] });
				}
			}
			const responseEmbed = new MessageEmbed()
				.setColor('#ff0000')
				.setTitle('Argument error')
				.setDescription(`${role.name} was not found in that message's role select menu.`);
			return interaction.reply({ embeds: [responseEmbed], ephemeral: true });
		}
	}

}
