import { Client, CommandInteraction } from 'discord.js';
import { GUILDS } from '@root/config';

async function register(bot: Client): Promise<void> {
	try {
		await loadCommands(bot);
	} catch (error) {
		bot.emit('error', error);
	}

	bot.on('interactionCreate', interaction => {
		if (interaction.isCommand()) runCommand(interaction);
	});
}

async function loadCommands(bot: Client) {
	const { commands } = bot.guilds.cache.get(GUILDS.MAIN);

	commands.create({
		name: 'sling',
		description: 'replies with slong'
	});
	commands.create({
		name: 'add',
		description: 'adds 2 numbers',
		options: [
			{
				name: 'a',
				description: 'first number to add',
				required: true,
				type: 'NUMBER'
			},
			{
				name: 'b',
				description: 'second number to add',
				required: true,
				type: 'NUMBER'
			}
		]
	});
}

async function runCommand(interaction: CommandInteraction) {
	const { commandName } = interaction;

	if (commandName === 'sling') {
		interaction.reply({
			content: 'slong'
		});
	}

	if (commandName === 'add') {
		const num1 = interaction.options.getNumber('a');
		const num2 = interaction.options.getNumber('b');

		interaction.reply({
			content: `${num1} + ${num2} = ${num1 + num2}`
		});
	}
}

export default register;
