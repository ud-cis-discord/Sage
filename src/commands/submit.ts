import { Message, MessageEmbed, TextChannel } from 'discord.js';
import { CHANNELS } from '@root/config';

export const description = 'Submit a profile picture to the pfp contest.';
export const extendedHelp = 'Exactly one file must be attached when running this command.';
export const usage = '[more information]';

export async function run(msg: Message, [imgDesc]: [string]): Promise<Message> {
	if (msg.attachments.size !== 1) return msg.channel.send(extendedHelp);

	const [attachment] = msg.attachments.array();

	if (!attachment.height) return msg.channel.send('The attachment must be an image file (jpg or png).');

	const submissionChannel = await msg.client.channels.fetch(CHANNELS.FEEDBACK) as TextChannel;
	return submissionChannel.send(new MessageEmbed()
		.setAuthor(msg.author.tag, msg.author.avatarURL({ dynamic: true }))
		.setTitle('New pfp submission')
		.addField('URL', attachment.url)
		.setDescription(imgDesc)
		.setImage(attachment.url)
		.setColor('BLUE')
		.setTimestamp())
		.then(() => msg.channel.send('Thank you for your submission.'));
}
