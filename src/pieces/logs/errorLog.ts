import { Client, TextChannel, MessageEmbed } from 'discord.js';
import { sendToFile } from '@lib/utils';
import { CommandError } from '@lib/types/errors';
import { CHANNELS } from '@root/config';

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(CHANNELS.ERROR_LOG) as TextChannel;
	bot.on('error', async error => {
		errLog.send(await generateLogEmbed(error));
	});
}

export default register;

async function generateLogEmbed(error: CommandError): Promise<MessageEmbed> {
	console.error(error);

	const embed = new MessageEmbed();

	embed.setTitle(error.name ? error.name : error.toString());

	if (error.message) {
		if (error.message.length < 1000) {
			embed.setDescription(`\`\`\`\n${error.message}\`\`\``);
		} else {
			embed.setDescription(`Full error message too big\n\`\`\`js\n${error.message.slice(0, 950)}...\`\`\``);
		}
	}

	if (error.stack) {
		if (error.stack.length < 1000) {
			embed.addField('Stack Trace', `\`\`\`js\n${error.stack}\`\`\``, false);
		} else {
			embed.addField('Stack Trace', 'Full stack too big, sent to file.', false);
			embed.attachFiles([await sendToFile(error.stack, 'js', 'error', true)]);
		}
	}
	embed.setTimestamp();
	embed.setColor('RED');

	if (error.msgContent) {
		embed.addField('Message content', `\`\`\`${error.msgContent}\`\`\``);
	}
	if (error.msgLink) {
		embed.addField('Original message', `[Check for flies](${error.msgLink})`);
	}

	return embed;
}
