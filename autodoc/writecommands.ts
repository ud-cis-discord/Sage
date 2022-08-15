import 'module-alias/register';
import { readdirRecursive } from '@root/src/lib/utils/generalUtils';
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
Here is a list of all of the commands available for Sage, usable with \`/<command name here>\`.
<br>
Note, any arguments to the commands will be shown with descriptions when you select the command you want to run.
`;

const staffInfo = `### Staff Commands
All of the staff-only commands can be found on [this page](https://ud-cis-discord.github.io/staff_pages/staff%20commands).`;

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
other commands, using \`/<command name here>\`in any channel that Sage is in, although we recommend running staff
commands in staff-only channels.

`;

async function main() {
	const categories = new Map<string, string>();

	const commandFiles = readdirRecursive(`${__dirname}/../src/commands`).filter(file => file.endsWith('.js'));
	for (const file of commandFiles) {
		const commandModule = await import(file);

		if (!(typeof commandModule.default === 'function')) {
			console.log(`Invalid command ${file}`);
			continue;
		}

		// eslint-disable-next-line new-cap
		const command: Command = new commandModule.default;

		// scrape commands
		const dirs = file.split('/');
		const name = dirs[dirs.length - 1].split('.')[0];
		command.name = name;
		command.category = dirs[dirs.length - 2] === 'commands' ? 'general' : dirs[dirs.length - 2];

		if (command.category === 'admin') {
			continue;
		}

		if (!categories.has(command.category)) {
			const catWords = command.category.split(' ');
			const formattedCat = catWords.map(word => word[0].toUpperCase() + word.substring(1)).join(' ');
			categories.set(command.category, `### ${formattedCat} Commands`);
		}

		let newCatText = `${categories.get(command.category)}\n\n**${command.name}**\n`;

		newCatText += command.description ? `\n- Description: ${command.description}\n` : ``;
		newCatText += command.extendedHelp ? `\n- More info: ${command.extendedHelp}\n` : ``;
		if (command.options) {
			newCatText += '\n- Parameters:\n';
			newCatText += command.options.map(param =>
				// eslint-disable-next-line @typescript-eslint/ban-ts-comment
				// @ts-ignore: see Note 1 comment block in help.ts
				`  - ${param.name} (${param.required ? 'required' : 'optional'}): ${param.description}`
			).join('\n');
		}
		categories.set(command.category, newCatText);
	}

	if (categories.get('question tagging')) {
		const qtLink = `${categories.get('question tagging')}
More info related to the question tagging system can also be found on [this page](https://ud-cis-discord.github.io/pages/Question%20Tagging).\n`;
		categories.set('question tagging', qtLink);
	}

	categories.forEach((_value, key) => {
		cmdMd += key === 'staff' ? `` : categories.get(key);
	});

	cmdMd += staffInfo;

	staffCmdMd += categories.get('staff');
	staffCmdMd += '\n[29]: https://ud-cis-discord.github.io/pages/commands (Commands)';

	fs.writeFileSync(`${__dirname}/../../Commands.md`, cmdMd);

	fs.writeFileSync(`${__dirname}/../../Staff Commands.md`, staffCmdMd);
}

main();
