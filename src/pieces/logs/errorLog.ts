import { Client, TextChannel, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { sendToFile } from '@root/src/lib/utils/generalUtils';
import { CommandError } from '@lib/types/errors';
import { CHANNELS } from '@root/config';

async function register(bot: Client): Promise<void> {
	const errLog = await bot.channels.fetch(CHANNELS.ERROR_LOG) as TextChannel;
	bot.on('error', async error => {
		const [embed, attachments] = await generateLogEmbed(error);
		errLog.send({ embeds: [embed as EmbedBuilder], files: attachments as AttachmentBuilder[] });
	});
}

export default register;

async function generateLogEmbed(error: CommandError): Promise<Array<EmbedBuilder | AttachmentBuilder[]>> {
	console.error(error);
	const embed = new EmbedBuilder();
	const attachments: AttachmentBuilder[] = [];

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
			embed.addFields({ name: 'Stack Trace', value: `\`\`\`js\n${error.stack}\`\`\``, inline: false });
		} else {
			embed.addFields({ name: 'Stack Trace', value: 'Full stack too big, sent to file.', inline: false });
			attachments.push(await sendToFile(error.stack, 'js', 'error', true));
		}
	}
	embed.setTimestamp();
	embed.setColor('Red');

	if (error.command) {
		embed.addFields({ name: 'Command run', value: `\`\`\`
${error.interaction.command.name} (${error.interaction.command.id})
Type: ${error.interaction.command.type}
\`\`\`` });
	}
	if (error.interaction) {
		embed.addFields({ name: 'Original interaction', value: `[Check for flies]
\`\`\`
Date: ${error.interaction.createdAt}
Channel: ${error.interaction.channel.id}
Created By: ${error.interaction.member.user.username} (${error.interaction.member.user.id})
\`\`\`
` });
	}

	return [embed, attachments];
}
