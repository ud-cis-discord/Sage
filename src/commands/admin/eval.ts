import { Message } from 'discord.js';
import prettyMilliseconds from 'pretty-ms';
import { inspect } from 'util';
import { BOT } from '@root/config';
import { sendToHastebin } from '@lib/utils';
import { botMasterPerms } from '@lib/permissions';

export const aliases = ['ev'];
export const description = 'Executes arbitrary JavaScript.';
export const usage = '<javascript>';

export async function permissions(msg: Message): Promise<boolean> {
	return botMasterPerms(msg);
}

export async function run(msg: Message, [js]: [string]): Promise<Message> {
	if (!js) return msg.channel.send('Please provide JS.');

	const response = msg.channel.send('<a:loading:755121200929439745> processing...');

	const code = js.includes('await') ? `(async () => {\n${js}\n})();` : js;
	let result;
	const start = Date.now();

	try {
		result = await eval(code);
	} catch (e) {
		result = e;
	}

	const took = Date.now() - start;
	result = inspect(result, { depth: 0 }).replace(RegExp(`${BOT.TOKEN}`, 'g'), 'token_was_here');

	let send = await sendToHastebin(result, 'js');
	if (result.length < 1900) {
		send = `\`\`\`js\n${send}\`\`\`\n`;
	}

	send += `\nTook ${prettyMilliseconds(took)}.`;
	return (await response).edit(send);
}
