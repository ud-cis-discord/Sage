import 'module-alias/register';
import { readdirRecursive } from '@lib/utils';
import { Command } from '@lib/types/Command';
import fs from 'fs';

let cmdMd = `---
waltz:
  title: Commands
  resource: page
  published: false
layout: page
title: Commands
permalink: pages/commands
---
Here is a list of all of the commands available for Sage, with the format \`s;command [arguments]\`.
<br>
Note, \`[argument]\` denotes an optional argument while \`<argument>\` denotes a required argument. Brackets should be omitted when running commands.
`;

let staffCmdMd = `---
waltz:
  title: Staff Commands
  resource: page
  published: false
layout: page
title: Staff Commands
permalink: staff_pages/staff%20commands
---
## Running Commands

As staff, you have access to some commands not listed in the general [commands page][29]. You run them the same as the
other commands, using \`s;[command] [arguments]\`in any channel that Sage is in, although we recommend running staff
commands in staff-only channels.

`;

async function main() {
	const categories = new Map<string, string>();

	const commandFiles = readdirRecursive(`${__dirname}/../src/commands`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const command: Command = await import(file);

		// scrape commands
		const dirs = file.split('/');
		const name = dirs[dirs.length - 1].split('.')[0];
		command.name = name;
		command.category = dirs[dirs.length - 2] === 'commands' ? 'general' : dirs[dirs.length - 2];

		if (!categories.has(command.category)) {
			const catWords = command.category.split(' ');
			const formattedCat = catWords.map(word => word[0].toUpperCase() + word.substring(1)).join(' ');
			categories.set(command.category, `### ${formattedCat} Commands`);
		}

		let newCatText = `${categories.get(command.category)}\n\n**${command.name}**\n`;

		newCatText += command.description ? `\n- Description: ${command.description}` : ``;
		newCatText += command.usage ? `\n- Usage: \`s;help ${command.usage}\`` : ``;
		newCatText += command.aliases ? `\n- Aliases: \`${command.aliases.map(alias => `"${alias}"`).join(', ')}\`` : ``;
		newCatText += command.extendedHelp ? `\n- More info: ${command.extendedHelp}\n` : ``;
		categories.set(command.category, newCatText);
	}

	categories.forEach((_value, key) => {
		cmdMd += key === 'staff' ? `` : categories.get(key);
	});

	staffCmdMd += categories.get('staff');

	fs.writeFileSync(`${__dirname}/../../Commands.md`, cmdMd);

	fs.writeFileSync(`${__dirname}/../../Staff Commands.md`, staffCmdMd);
}

main();
