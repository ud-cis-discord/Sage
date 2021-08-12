import { BOT } from '@root/config';
import { Message, MessageEmbed, MessageReaction } from 'discord.js';
import parse from 'parse-duration';
import prettyMilliseconds from 'pretty-ms';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Have ${BOT.NAME} create a poll for you`;
	aliases = ['vote'];
	usage = '<timespan>|<question>|<choices...>';
	extendedHelp = 'You can have two to ten choices.';
	runInDM = false;


	async run(msg: Message, [timespan, question, ...choices]: [number, string, ...Array<string>]): Promise<Message> {
		const emotes = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].slice(0, choices.length);

		let choiceText = '';
		choices.forEach((choice, option) => {
			choiceText += `${emotes[option]} ${choice}\n`;
		});
		choiceText = choiceText.trim();

		const pollEmbed = new MessageEmbed()
			.setTitle(`Poll from ${msg.member.displayName}`)
			.addField(question, choiceText)
			.setFooter(`This poll ends in ${prettyMilliseconds(timespan, { verbose: true })}`)
			.setColor('RANDOM');


		const pollMsg = await msg.channel.send({ embeds: [pollEmbed] });

		emotes.forEach(emote => pollMsg.react(emote));

		return pollMsg.awaitReactions(
			(reaction: MessageReaction) => emotes.includes(reaction.emoji.name),
			{ time: timespan }
		).then(reactions => {
			let maxVotes = 0;
			reactions.forEach(reaction => {
				if (reaction.users.cache.size > maxVotes) maxVotes = reaction.users.cache.size;
			});

			pollEmbed.fields = [{
				name: question,
				value: choiceText
					.split('\n')
					.map((choice, idx) => {
						const votes = reactions.get(emotes[idx]).count - 1;
						return `${choice} - ${votes} vote${votes === 1 ? '' : 's'}`;
					}).join('\n'),
				inline: false
			}];

			if (maxVotes <= 1) {
				pollMsg.edit({ embeds: [pollEmbed
					.addField('Results', 'The poll ended but it looks like no one voted ☹!')
					.setFooter('This poll has ended')] });

				const embed = new MessageEmbed()
					.setTitle(`Poll from ${msg.member.displayName}`)
					.setDescription(`The poll ended but it looks like no one voted ☹!\n\n[Click to view poll](${pollMsg.url})`)
					.setColor(pollEmbed.color);
				return pollMsg.channel.send({ embeds: [embed] });
			}

			const winners = reactions
				.filter(reaction => reaction.users.cache.size >= maxVotes)
				.map(reaction => choices[emotes.indexOf(reaction.emoji.name)]);

			pollMsg.edit({ embeds: [pollEmbed
				.addField('Results', this.winMessage(winners, maxVotes - 1))
				.setFooter('This poll has ended')] });
			pollMsg.reactions.removeAll();
			const embed = new MessageEmbed()
				.setTitle(`Poll from ${msg.member.displayName} Result`)
				.addField(question, `${this.winMessage(winners, maxVotes - 1)}\n\n[Click to view poll](${pollMsg.url})`)
				.setColor(pollEmbed.color);
			return pollMsg.channel.send({ embeds: [embed] });
		});
	}

	argParser(_msg: Message, input: string): Array<number | string> {
		const [rawTimespan, ...rest] = input.split('|').map(arg => arg.trim());

		const timespan = parse(rawTimespan);
		if (!timespan) throw `**${rawTimespan}** is not a valid timespan!\n\nUsage: ${this.usage}`;

		if (rest.length < 3) throw 'I need at least two choices to make a poll.';
		if (rest.length > 11) throw 'Sorry but that\'s too many choices for me. Please use ten or less.';

		return [timespan, ...rest];
	}

	winMessage = (options: Array<string>, votes: number): string => options.length === 1
		? `**${options}** won the poll with ${votes} vote${votes === 1 ? '' : 's'}.`
		: `**${options.join('** & **')}** tied the poll with ${votes} vote${votes === 1 ? '' : 's'} each.`;

}
