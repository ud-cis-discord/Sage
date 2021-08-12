import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { BOT, CHANNELS, MAINTAINERS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Provide feedback or bug reports about ${BOT.NAME}.`;
	usage = '<suggestion>';
	aliases = ['suggest'];

	async run(msg: Message, [suggestion]: [string]): Promise<Message> {
		const feedbackChannel = await msg.client.channels.fetch(CHANNELS.FEEDBACK) as TextChannel;

		const embed = new MessageEmbed()
			.setAuthor(msg.author.tag, msg.author.avatarURL({ dynamic: true }))
			.setTitle('New Feedback')
			.setDescription(suggestion)
			.setColor('DARK_GREEN')
			.setTimestamp();

		feedbackChannel.send({ embeds: [embed] });

		return msg.channel.send(`Thanks! I've sent your feedback to ${MAINTAINERS}.`);
	}

	argParser(_msg: Message, input: string): [string] {
		if (input === '') throw `Usage: ${this.usage}`;
		return [input];
	}

}
