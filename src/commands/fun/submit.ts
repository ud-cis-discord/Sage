import { CommandInteraction, Message, MessageEmbed, TextChannel } from 'discord.js';
import { CHANNELS } from '@root/config';
import { Command } from '@lib/types/Command';
import { generateErrorEmbed } from '../lib/utils';

const SUBMIT_TIMEOUT = 30;

export default class extends Command {

	description = 'Submit an image to the current contest. After using this command upload an image in another message'; // lol thanks 100 char limit

	run(_msg: Message): Promise<void> { return; }

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const submitEmbed = new MessageEmbed()
			.setTitle(`${interaction.user.username}, send your image submission for the contest in a separate message, along with an optional description in the same message.`)
			.setDescription(`Your file must be a JPG or PNG. You must attach the image to the message, image links will not work.`)
			.setColor('GREEN')
			.setFooter(`You have ${SUBMIT_TIMEOUT} seconds to submit.`);
		interaction.reply({ embeds: [submitEmbed] });

		let timeout = SUBMIT_TIMEOUT;

		const filter = (m: Message) => m.author.id === interaction.user.id;

		const collector = interaction.channel.createMessageCollector({
			filter,
			max: 1,
			time: SUBMIT_TIMEOUT * 1000
		});

		const countdown = setInterval(() => this.countdown(interaction, --timeout, submitEmbed), 1000);

		collector.on('collect', async i => {
			if (i.attachments.size < 1) {
				interaction.channel.send({ embeds: [generateErrorEmbed(`You have to submit an image! Please re-run /submit and try again.`)] });
				return;
			}
			if (i.attachments.size > 1) {
				interaction.channel.send({ embeds: [generateErrorEmbed(`You can only submit one image! Please re-run /submit and try again.`)] });
				return;
			}
			if (i.attachments.first().url.indexOf('.png') === -1 && i.attachments.first().url.indexOf('.jpg') === -1 && i.attachments.first().url.indexOf('.jpeg') === -1) {
				interaction.channel.send({ embeds: [generateErrorEmbed(`Your submission must be a JPG or PNG. Please re-run /submit and try again.`)] });
				return;
			} else {
				const submissionChannel = await interaction.client.channels.fetch(CHANNELS.FEEDBACK) as TextChannel;
				const imgDesc = i.content || '';
				const embed = new MessageEmbed()
					.setAuthor(i.author.tag, i.author.avatarURL({ dynamic: true }))
					.setTitle('New contest submission')
					.addField('URL', i.attachments.first().url)
					.setDescription(imgDesc)
					.setImage(i.attachments.first().url)
					.setColor('BLUE')
					.setTimestamp();
				submissionChannel.send({ embeds: [embed] }).then(() => interaction.channel.send({ content: `Thanks for your submission, ${i.author.username}!` }));
			}
		}).on('end', async collected => {
			const validCollected = collected.filter(i => i.author.id === interaction.user.id);
			clearInterval(countdown);
			if (timeout === 1 && validCollected.size === 0) { // when clearInterval is used, timeout sticks to 1 second
				return interaction.deleteReply();
			}
		});
	}

	countdown(interaction: CommandInteraction, timeout: number, embed: MessageEmbed): void {
		const footerText = `You have ${timeout} second${timeout !== 1 ? 's' : ''} to submit.`;
		embed.setFooter(footerText);
		interaction.editReply({ embeds: [embed] });
	}

}
