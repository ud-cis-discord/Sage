import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { CHANNELS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Submit an image to the currently running contest.';
	extendedHelp = 'Exactly one file must be attached when running this command.';
	usage = '[more information]';
	enabled = false;

	async run(msg: Message, [imgDesc]: [string]): Promise<Message> {
		const [attachment] = [...msg.attachments.values()];
		if (!attachment.height) return msg.channel.send('The attachment must be an image file (jpg or png).');

		const submissionChannel = await msg.client.channels.fetch(CHANNELS.FEEDBACK) as TextChannel;
		const embed = new MessageEmbed()
			.setAuthor(msg.author.tag, msg.author.avatarURL({ dynamic: true }))
			.setTitle('New contest submission')
			.addField('URL', attachment.url)
			.setDescription(imgDesc)
			.setImage(attachment.url)
			.setColor('BLUE')
			.setTimestamp();

		submissionChannel.send({ embeds: [embed] }).then(() => msg.channel.send('Thank you for your submission.'));
	}

	argParser(msg: Message, input: string): Array<string> {
		if (msg.attachments.size !== 1) throw this.extendedHelp;
		return [input];
	}

}
