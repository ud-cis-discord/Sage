import { BOT, DB } from '@root/config';
import { ApplicationCommandOptionData, ButtonInteraction, Client,
	CommandInteraction, CommandInteractionOptionResolver, MessageActionRow, MessageButton, MessageEmbed } from 'discord.js';
import parse from 'parse-duration';
import { Command } from '@lib/types/Command';
import { dateToTimestamp, generateErrorEmbed } from '@lib/utils/generalUtils';
import { Poll, PollResult } from '@lib/types/Poll';
import { SageInteractionType } from '@lib/types/InteractionType';

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
			name: 'optiontype',
			description: `Whether participants can only select one choice or multiple.`,
			type: 'STRING',
			required: true,
			choices: args.map((arg) => ({
				name: arg,
				value: arg
			}))
		},
		{
			name: 'choice1',
			description: 'The first choice that appears on the poll',
			type: 'STRING',
			required: true
		},
		{
			name: 'choice2',
			description: 'The second choice that appears on the poll',
			type: 'STRING',
			required: true
		},
		{
			name: 'choice3',
			description: 'The third choice that appears on the poll',
			type: 'STRING',
			required: false
		},
		{
			name: 'choice4',
			description: 'The fourth choice that appears on the poll',
			type: 'STRING',
			required: false
		},
		{
			name: 'choice5',
			description: 'The fifth choice that appears on the poll',
			type: 'STRING',
			required: false
		},
		{
			name: 'choice6',
			description: 'The sixth choice that appears on the poll',
			type: 'STRING',
			required: false
		},
		{
			name: 'choice7',
			description: 'The seventh choice that appears on the poll',
			type: 'STRING',
			required: false
		},
		{
			name: 'choice8',
			description: 'The eighth choice that appears on the poll',
			type: 'STRING',
			required: false
		},
		{
			name: 'choice9',
			description: 'The ninth choice that appears on the poll',
			type: 'STRING',
			required: false
		},
		{
			name: 'choice10',
			description: 'The tenth choice that appears on the poll',
			type: 'STRING',
			required: false
		},
		
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
		const choices = this.getChoices(interaction.options);
		console.log(choices)
		if (new Set(choices).size !== choices.length) {
			return interaction.reply({ content: `All poll options must be unique.`, ephemeral: true });
		}
		if (!args.includes(interaction.options.getString('optiontype'))) {
			throw `poll option types must be one of ${args.join(', ')}`;
		}
		const pollType = interaction.options.getString('optiontype') as 'Single' | 'Multiple';

		const choiceQuantities = Array.from({ length: choices.length }, () => 0); // number of selections for each choice

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
			choiceText += `${emotes[index]} ${choice}: ${choiceQuantities[index]} vote${choiceQuantities[index] === 1 ? '' : 's'}\n`;
		});
		choiceText = choiceText.trim();

		const pollFooter = pollType === 'Multiple'
			? 'You can select multiple options. You can remove your vote for a choice simply by pressing the choice\'s button again.'
			: 'You can only select one option. You can change your vote by pressing another button or remove your vote for a choice simply by pressing the choice\'s button again.';
		const pollEmbed = new MessageEmbed()
			.setTitle(question)
			.setDescription(`This poll was created by ${interaction.user.username} and ends **${mdTimestamp}**`)
			.addField('Choices', choiceText)
			.setFooter({ text: pollFooter })
			.setColor('RANDOM');

		const choiceBtns = []; // first 5 choices
		const choiceBtns2 = []; // next 5
		choices.forEach((choice, index) => {
			if (index < 5) {
				choiceBtns.push(new MessageButton({ label: `${choice}`,
					customId: `${SageInteractionType.POLL}_${choice}`,
					style: 'SECONDARY',
					emoji: `${emotes[index]}` }));
			} else {
				choiceBtns2.push(new MessageButton({
					label: `${choice}`,
					customId: `${SageInteractionType.POLL}_${choice}`,
					style: 'SECONDARY',
					emoji: `${emotes[index]}`
				}));
			}
		});

		if (choiceBtns2.length === 0) {
			interaction.reply({ embeds: [pollEmbed], components: [new MessageActionRow({ components: choiceBtns })] });
		} else {
			interaction.reply({ embeds: [pollEmbed], components: [new MessageActionRow({ components: choiceBtns }), new MessageActionRow({ components: choiceBtns2 })] });
		}

		let replyId: string;
		await interaction.fetchReply().then(reply => { replyId = reply.id; });

		await interaction.client.mongo.collection<Poll>(DB.POLLS).insertOne({
			owner: interaction.user.id,
			message: replyId,
			expires: new Date(Date.now() + timespan),
			results: choices.map(choice => ({
				option: choice,
				users: []
			})),
			question: question,
			channel: interaction.channelId,
			type: pollType
		});
	}

	getChoices(options: Omit<CommandInteractionOptionResolver, 'getMessage' | 'getFocused'>): string[] {
		const choices = [];

		this.options.forEach(option => {
			if (option.name.startsWith('choice')) {
				choices.push(options.getString(option.name))
			}
		})

		return choices.filter(choice => choice);
	}

	winMessage = (options: Array<string>, votes: number): string => options.length === 1
		? `**${options}** won the poll with ${votes} vote${votes === 1 ? '' : 's'}.`
		: `**${options.join('** & **')}** tied the poll with ${votes} vote${votes === 1 ? '' : 's'} each.`;

}

export async function handlePollOptionSelect(bot: Client, i: ButtonInteraction): Promise<void> {
	const pollMsg = await i.channel.messages.fetch(i.message.id);
	const dbPoll = await bot.mongo.collection<Poll>(DB.POLLS).findOne({ message: pollMsg.id });
	const pollOwner = await i.guild.members.fetch(dbPoll.owner);
	let newPoll = { ...dbPoll };
	const emotes = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣', '6️⃣', '7️⃣', '8️⃣', '9️⃣', '🔟'].slice(0, newPoll.results.length);
	const newChoice = i.customId.split('_')[1];

	const prevAnswers = dbPoll.results.filter(r => r.users.includes(i.user.id)).map(res => res.option);

	if (prevAnswers.length === 0 || !prevAnswers.includes(newChoice)) {
		newPoll = { ...newPoll, results: addAnswer(newPoll.results, i.user.id, newChoice) };
	}
	// if they clicked the same answer again or the poll was a single poll and they had a previous answer
	if (prevAnswers.includes(newChoice) || (prevAnswers && newPoll.type === 'Single')) {
		newPoll = { ...newPoll, results: removeAnswer(
			newPoll.results,
			i.user.id,
			newPoll.type === 'Single' ? prevAnswers[0] : newChoice) };
	}

	const resultMap = new Map<string, number>();
	newPoll.results.forEach(res => {
		resultMap.set(res.option, res.users.length);
	});

	let choiceText = '';
	let count = 0;
	const choiceBtns: MessageButton[] = [];
	resultMap.forEach((value, key) => {
		choiceText += `${emotes[count]} ${key}: ${value} vote${value === 1 ? '' : 's'}\n`;
		choiceBtns.push(new MessageButton({
			label: `${key}`,
			customId: `${SageInteractionType.POLL}_${key}`,
			style: 'SECONDARY',
			emoji: `${emotes[count++]}`
		}));
	});

	choiceText = choiceText.trim();

	const pollFooter = newPoll.type === 'Multiple'
		? 'You can select multiple options. You can remove your vote for a choice simply by pressing the choice\'s button again.'
		: 'You can only select one option. You can change your vote by pressing another button or remove your vote for a choice simply by pressing the choice\'s button again.';
	const pollEmbed = new MessageEmbed()
		.setTitle(newPoll.question)
		.setDescription(`This poll was created by ${pollOwner.displayName} and ends **${dateToTimestamp(newPoll.expires, 'R')}**`)
		.addField('Choices', choiceText)
		.setFooter(pollFooter)
		.setColor('RANDOM');

	const msgComponents = [new MessageActionRow({ components: choiceBtns.slice(0, 5) })];
	if (choiceBtns.length > 5) msgComponents.push(new MessageActionRow({ components: choiceBtns.slice(5) }));

	await pollMsg.edit({ embeds: [pollEmbed], components: msgComponents });
	if (prevAnswers.length === 0 || !prevAnswers.includes(newChoice)) {
		await i.reply({ ephemeral: true, content: `Vote for ***${newChoice}*** recorded. To remove it, click the same option again.` });
	}
	if (!i.replied) await i.reply({ ephemeral: true, content: `Vote for ${newChoice} removed.` });

	await i.client.mongo.collection<Poll>(DB.POLLS).findOneAndReplace({ message: newPoll.message }, newPoll);
	return;
}

/**
 * Takes in a list of poll results, a user, and a choice. Removes that user from
 * the choice's user array.
 * @param {PollResult[]} results The results to edit
 * @param {string} user The user whose answer should be removed
 * @param {string} choice The choice to remove a user from
 * @returns {PollResult[]} The updated list of results
 */
function removeAnswer(results: PollResult[], user: string, choice: string) {
	return results.map(r => {
		if (r.option === choice) {
			return { ...r, users: r.users.filter(id => id !== user) };
		} else { return r; }
	});
}


/**
 * Takes in a list of poll results, a user, and a choice. Adds that user to the
 * choice's user array.
 * @param {PollResult[]} results The results to edit
 * @param {string} user The user whose answer should be added
 * @param {string} choice The choice to add a user to
 * @returns {PollResult[]} The updated list of results
 */
function addAnswer(results: PollResult[], user: string, choice: string) {
	return results.map(r => {
		if (r.option === choice) {
			return { ...r, users: [...r.users, user] };
		} else { return r; }
	});
}
