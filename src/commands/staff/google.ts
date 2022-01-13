import { staffPerms } from '@lib/permissions';
import { Command } from '@lib/types/Command';
import { BOT, ROLES } from '@root/config';
import { MessageEmbed, Message, ApplicationCommandPermissionData, ApplicationCommandOptionData, CommandInteraction } from 'discord.js';

export default class extends Command {

	tempPermissions: ApplicationCommandPermissionData[] = [{
		id: ROLES.STAFF,
		permission: true,
		type: 'ROLE'
	}];

	aliases = ['lmgt', 'lmg'];
	description = `Have ${BOT.NAME} google something for someone`;
	usage = '<query>';

	options: ApplicationCommandOptionData[] = [
		{
			name: 'query',
			type: 'STRING',
			description: `What you'd like ${BOT.NAME} to Google for someone!`,
			required: true
		}
	];

	tempRun(interaction: CommandInteraction): Promise<void> {
		const query = interaction.options.getString('query');
		const formatted = query.replace(new RegExp(' ', 'g'), '+').replace('%', '%25');
		const link = `https://letmegooglethat.com/?q=${formatted}`;
		const embed = new MessageEmbed({
			description: `[Let me Google that for you!](${link})`,
			color: 'LUMINOUS_VIVID_PINK'
		});
		return interaction.reply({ embeds: [embed] });
	}


	async permissions(msg: Message): Promise<boolean> {
		return staffPerms(msg);
	}

	async run(msg: Message, [query]: [string]): Promise<Message> {
		const formatted = query.replace(new RegExp(' ', 'g'), '+').replace('%', '%25');
		const link = `https://letmegooglethat.com/?q=${formatted}`;
		const embed = new MessageEmbed({
			description: `[Let me Google that for you!](${link})`,
			color: 'LUMINOUS_VIVID_PINK'
		});
		return msg.channel.send({ embeds: [embed] });
	}

	argParser(_msg: Message, input: string): Array<string> {
		if (!input) throw `What do you want ${BOT.NAME} to google? (Usage: ${this.usage})`;
		else return [input];
	}

}
