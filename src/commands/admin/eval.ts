import { Message, Team } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { inspect } from 'util';
import fetch from 'node-fetch';
import { BOT } from '@root/config';

export const aliases = ['ev'];
export const decription = 'Executes arbitrary JavaScript.';
export const useage = '<javascript>';

export async function permissions(msg: Message): Promise<boolean> {
	const team = (await msg.client.fetchApplication()).owner as Team;
	return team.members.has(msg.author.id);
}

export async function run(msg: Message, [js]: [string]): Promise<Message> {
	if (!js) return msg.channel.send('Please provide JS.');

	const responce = msg.channel.send('<a:loading:755121200929439745> processing...');

	const code = js.includes('await') ? `(async () => {\n${js}\n})();` : js;
	let result;
	const start = Date.now();

	try {
		result = await eval(code);
	} catch (e) {
		result = e;
	}

	const took = Date.now() - start;
	result = inspect(result, { depth: 1 }).replace(BOT.TOKEN, 'token_was_here');
	let send: string;

	if (result.length < 1900) {
		send = `\`\`\`js\n${result}\`\`\`\nTook ${prettyMilliseconds(took)}.`;
	} else {
		const res = await fetch('https://hastebin.com/documents', { method: 'POST', body: result }).then(r => r.json());
		send = `Result too long for Discord, uploaded to hastebin: <https://hastebin.com/${res.key}.js>\n\nTook ${prettyMilliseconds(took)}.`;
	}

	return (await responce).edit(send);
}
