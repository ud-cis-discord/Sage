import { BOT } from '@root/config';
import { ApplicationCommandOptionData, ButtonInteraction, CommandInteraction, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import parse from 'parse-duration';
import { Command } from '@lib/types/Command';
import { generateErrorEmbed } from '@root/src/lib/utils';

const QUESTION_CHAR_LIMIT = 256;
const args = ['Single', 'Multiple'];

export default class extends Command {

	description = `Have ${BOT.NAME} create a poll for you.`;

	options: ApplicationCommandOptionData[] = [
		{
			name: 'timespan',
			description: `How long your poll should last. Acceptable formats include '5s', '5m', '5h', '5h30m', '7h30m15s'...`,
			type: 'STRING',
			required: true
		},
		{
			name: 'question',
			description: `What would you like to ask?`,
			type: 'STRING',
			required: true
		},
		{
			name: 'choices',
			description: `A poll can have 2-10 choices. Separate choices with '|' (no spaces/quotes).`,
			type: 'STRING',
			required: true
		},
		{
			name: 'optiontype',
			description: `Whether participants can only select one choice or multiple.`,
			type: 'STRING',
			required: true,
			choices: args.map((arg) => ({
				name: arg,
				value: arg
			}))
		}
	]
	runInDM = false;

	resetArray(array: number[], len: number): number[] {
		for (let i = 0; i < len; i++) {
			array[i] = 0;
		}
		return array;
	}

	async run(interaction: CommandInteraction): Promise<void> {
		const timespan = parse(interaction.options.getString('timespan'));
		const question = interaction.options.getString('question');
		const choices = interaction.options.getString('choices').split('|').map(choice => choice.trim());

		const userSelections = new Map(); // user ID, their choice(s)
		const choiceQuantites = Array.from({ length: choices.length }, () => 0); // number of selections for each choice

		const emotes = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].slice(0, choices.length);

		if (!timespan) {
			return interaction.reply({ embeds: [generateErrorEmbed(`${interaction.options.getString('timespan')} is not a valid timespan. Acceptable formats include '5s', '5m', 
			'5h', '5h30m', '7h30m15s'...`)], ephemeral: true });
		}
		if (question.length > QUESTION_CHAR_LIMIT) {
			return interaction.reply({ embeds: [generateErrorEmbed(`Your question is too long. Please keep it under ${QUESTION_CHAR_LIMIT} characters.`)], ephemeral: true });
		}
		if (choices.length < 2) {
			return interaction.reply({ embeds: [generateErrorEmbed(`You must supply at least 2 choices to make a poll.`)], ephemeral: true });
		}
		if (choices.length > 10) {
			return interaction.reply({ embeds: [generateErrorEmbed(`You cannot supply more than 10 choices.`)], ephemeral: true });
		}

		const mdTimestamp = `<t:${Math.floor(Date.now() / 1000) + (timespan / 1000)}:R>`;

		let choiceText = '';
		choices.forEach((choice, index) => {
			choiceText += `${emotes[index]} ${choice}: ${choiceQuantites[index]} vote${choiceQuantites[index] === 1 ? '' : 's'}\n`;
		});
		choiceText = choiceText.trim();

		let pollFooter = interaction.options.getString('optiontype') === 'Multiple'
			? 'You can select multiple options. You can remove your vote for a choice simply by pressing the choice\'s button again.'
			: 'You can only select one option. You can change your vote by pressing another button or remove your vote for a choice simply by pressing the choice\'s button again.';
		let pollEmbed = new MessageEmbed()
			.setTitle(question)
			.setDescription(`This poll was created by ${interaction.user.username} and ends **${mdTimestamp}**`)
			.addField('Choices', choiceText)
			.setFooter({ text: pollFooter })
			.setColor('RANDOM');

		const choiceBtns = []; // first 5 choices
		const choiceBtns2 = []; // next 5
		choices.forEach((choice, index) => {
			if (index < 5) {
				choiceBtns.push(new MessageButton({ label: `${choice}`, customId: `${index + 1}`, style: 'SECONDARY', emoji: `${emotes[index]}` }));
			} else {
				choiceBtns2.push(new MessageButton({ label: `${choice}`, customId: `${index + 1}`, style: 'SECONDARY', emoji: `${emotes[index]}` }));
			}
		});

		if (choiceBtns2.length === 0) {
			interaction.reply({ embeds: [pollEmbed], components: [new MessageActionRow({ components: choiceBtns })] });
		} else {
			interaction.reply({ embeds: [pollEmbed], components: [new MessageActionRow({ components: choiceBtns }), new MessageActionRow({ components: choiceBtns2 })] });
		}

		let replyId;
		interaction.fetchReply().then(reply => { replyId = reply.id; });

		const collector = interaction.channel.createMessageComponentCollector({
			time: timespan,
			filter: i => i.message.id === replyId
		});

		collector.on('collect', async (i: ButtonInteraction) => {
			choiceQuantites.fill(0);

			const usersChoices = userSelections.get(i.user.id) || [];
			if (usersChoices && usersChoices.includes(i.customId)) { // user has already selected choice
				if (interaction.options.getString('optiontype') === 'Multiple') {
					usersChoices.splice(usersChoices.indexOf(i.customId), 1);
					userSelections.set(i.user.id, usersChoices); // set this user's choice
				} else {
					userSelections.delete(i.user.id);
				}
			} else if (interaction.options.getString('optiontype') === 'Multiple') {
				usersChoices.push(i.customId);
				userSelections.set(i.user.id, usersChoices); // set this user's choice
			} else {
				userSelections.set(i.user.id, i.customId);
			}

			userSelections.forEach(vote => {
				if (interaction.options.getString('optiontype') === 'Multiple') {
					vote.forEach(selected => {
						choiceQuantites[Number(selected) - 1] += 1;
					});
				} else {
					choiceQuantites[Number(vote) - 1] += 1;
				}
			});

			choiceText = '';
			for (let j = 0; j < choices.length; j++) {
				choiceText += `${emotes[j]} ${choices[j]}: ${choiceQuantites[j]} vote${choiceQuantites[j] === 1 ? '' : 's'}\n`;
			}
			choiceText = choiceText.trim();

			pollFooter = interaction.options.getString('optiontype') === 'Multiple'
				? 'You can select multiple options. You can remove your vote for a choice simply by pressing the choice\'s button again.'
				: 'You can only select one option. You can change your vote by pressing another button or remove your vote for a choice simply by pressing the choice\'s button again.';
			pollEmbed = new MessageEmbed()
				.setTitle(question)
				.setDescription(`This poll was created by ${interaction.user.username} and ends **${mdTimestamp}**`)
				.addField('Choices', choiceText)
				.setFooter({ text: pollFooter })
				.setColor('RANDOM');

			if (choiceBtns2.length === 0) {
				interaction.editReply({ embeds: [pollEmbed], components: [new MessageActionRow({ components: choiceBtns })] });
			} else {
				interaction.editReply({ embeds: [pollEmbed], components: [new MessageActionRow({ components: choiceBtns }), new MessageActionRow({ components: choiceBtns2 })] });
			}

			i.deferUpdate(); // this makes it so "This interaction failed" does not appear when pressing buttons (since we don't reply again)
		}).on('end', () => {
			pollEmbed = new MessageEmbed()
				.setTitle(question)
				.setDescription(`This poll was created by ${interaction.user.username} and ended **${mdTimestamp}**`)
				.addField('Choices', choiceText)
				.setColor('RANDOM');
			interaction.editReply({ embeds: [pollEmbed], components: [] });
		});
	}

	winMessage = (options: Array<string>, votes: number): string => options.length === 1
		? `**${options}** won the poll with ${votes} vote${votes === 1 ? '' : 's'}.`
		: `**${options.join('** & **')}** tied the poll with ${votes} vote${votes === 1 ? '' : 's'} each.`;

}
