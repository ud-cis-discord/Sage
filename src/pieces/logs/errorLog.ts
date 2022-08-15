import { Client, TextChannel, MessageEmbed, MessageAttachment } from 'discord.js';
import { sendToFile } from '@root/src/lib/utils/generalUtils';
import { CommandError } from '@lib/types/errors';
import { CHANNELS } from '@root/config';

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(CHANNELS.ERROR_LOG) as TextChannel;
	bot.on('error', async error => {
		const [embed, attachments] = await generateLogEmbed(error);
		errLog.send({ embeds: [embed as MessageEmbed], files: attachments as MessageAttachment[] });
	});
}

export default register;

async function generateLogEmbed(error: CommandError): Promise<Array<MessageEmbed | MessageAttachment[]>> {
	console.error(error);
	const embed = new MessageEmbed();
	const attachments: MessageAttachment[] = [];

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
			attachments.push(await sendToFile(error.stack, 'js', 'error', true));
		}
	}
	embed.setTimestamp();
	embed.setColor('RED');

	if (error.command) {
		embed.addField('Command run', `\`\`\`
${error.interaction.command.name} (${error.interaction.command.id})
Type: ${error.interaction.command.type}
\`\`\``);
	}
	if (error.interaction) {
		embed.addField('Original interaction', `[Check for flies]
\`\`\`
Date: ${error.interaction.createdAt}
Channel: ${error.interaction.channel.id}
Created By: ${error.interaction.member.user.username} (${error.interaction.member.user.id})
\`\`\`
`);
	}

	return [embed, attachments];
}
