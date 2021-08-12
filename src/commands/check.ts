import { Message, MessageEmbed } from 'discord.js';
import { SageUser } from '@lib/types/SageUser';
import { DB, MAINTAINERS } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Displays the users current message count. 
	If the word 'here' is used as an argument, the message count will be 
	sent in the same channel that the command was used in (rather than the user's dms).`;
	usage = '[here]';
	aliases = ['count'];

	async run(msg: Message, [here]: [string]): Promise<void> {
		const user: SageUser = await msg.author.client.mongo.collection(DB.USERS).findOne({ discordId: msg.author.id });

		if (!user) {
			msg.reply(`I couldn't find you in the database, if you think this is an error please contact ${MAINTAINERS}.`);
			return;
		}

		const embed = new MessageEmbed()
			.setTitle(`${msg.author.username}'s Progress`)
			.setThumbnail(msg.author.avatarURL())
			.addField('Message Count', `You have sent **${user.count}** message${user.count === 1 ? '' : 's'} this week in academic course channels.`, true)
			.addField('Level Progress', `You're **${user.curExp}** messages away from **Level ${user.level + 1}**
			${this.progressBar(user.levelExp - user.curExp, user.levelExp, 18)}`, false);
		if (here === 'here') {
			msg.channel.send({ embeds: [embed] });
		} else {
			msg.author.send({ embeds: [embed] })
				.then(() => { if (msg.channel.type !== 'dm') msg.channel.send('Your message count has been sent to your DMs.'); })
				.catch(() => msg.channel.send('I couldn\'t send you a DM. Please enable DMs and try again.'));
		}
		return;
	}

	progressBar(value: number, maxValue: number, size: number): string {
		const percentage = value / maxValue; // Calculate the percentage of the bar
		const progress = Math.round(size * percentage); // Calculate the number of square caracters to fill the progress side.
		const emptyProgress = size - progress; // Calculate the number of dash caracters to fill the empty progress side.

		const progressText = `${'🟩'.repeat(Math.max(progress - 1, 0))}✅`; // Repeat is creating a string with progress * caracters in it
		const emptyProgressText = '⚫'.repeat(emptyProgress); // Repeat is creating a string with empty progress * caracters in it
		const percentageText = `${Math.round(percentage * 100)}%`; // Displaying the percentage of the bar

		return `${progressText}${emptyProgressText} **${percentageText}**`;
	}

}
