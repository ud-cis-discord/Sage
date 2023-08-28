import { ApplicationCommandOptionData, ApplicationCommandOptionType, ChatInputCommandInteraction, EmbedBuilder, InteractionResponse, TextChannel } from 'discord.js';
import { CHANNELS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Submit an image to the current contest. After using this command upload an image in another message'; // lol thanks 100 char limit
	options: ApplicationCommandOptionData[] = [
		{
			name: 'file',
			description: 'A file to be submitted',
			type: ApplicationCommandOptionType.Attachment,
			required: true
		},
		{
			name: 'description',
			description: 'Description of your submission',
			type: ApplicationCommandOptionType.String,
			required: false
		}
	]

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const submissionChannel = await interaction.client.channels.fetch(CHANNELS.FEEDBACK) as TextChannel;
		const file = interaction.options.getAttachment('file');
		const description = interaction.options.getString('description');

		const embed = new EmbedBuilder()
			.setTitle(`New contest submission from ${interaction.user.tag}`)
			.addFields({ name: 'URL', value: file.url })
			.setImage(file.url)
			.setColor('Blue')
			.setTimestamp();

		if (description) embed.setDescription(description);
		submissionChannel.send({ embeds: [embed] }).then(() => interaction.reply({ content: `Thanks for your submission, ${interaction.user.username}!` }));
	}

}
