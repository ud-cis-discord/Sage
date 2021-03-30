/* eslint-disable camelcase */
import { adminPerms } from '@lib/permissions';
import { RequestError } from '@octokit/types';
import { Message } from 'discord.js';

export const usage = '<title>|[options]';
export const extendedHelp = `You must pass in an issue title. Flags can be any of:
--labels=[comma, separated, list]\n--milestone=[milestone number]\n--project=[project (defaults to SageV2)]]`;

export async function permissions(msg: Message): Promise<boolean> {
	return adminPerms(msg);
}

export async function run(msg: Message, [title, project, labels, milestone]: [string, string, string[], string]): Promise<Message | void> {
	const newIssue = await msg.client.octokit.issues.create({
		owner: 'ud-cis-discord',
		repo: project,
		title: title,
		milestone: milestone || undefined,
		labels: labels
	}).catch(response => {
		console.log(response);
		let errormsg = '';
		const { errors } = response as RequestError;
		errors.forEach(error => {
			errormsg += `Value ${error.code} for field ${error.field}.\n`;
		});
		msg.channel.send(`Issue creation failed. (HTTP Error ${response.status})
\`\`\`diff
-${errormsg}\`\`\``);
	});

	if (newIssue) {
		return msg.channel.send(`I've created your issue at <${newIssue.data.html_url}>`);
	} else {
		return msg.channel.send('Something went horribly wrong with issue creation! Blame Josh.');
	}
}

export async function argParser(_msg: Message, input: string): Promise<Array<string | string[]>> {
	const [title, ...args] = input.split('--');
	if (!title) throw `Usage: ${usage}`;

	const splitArgs = args.map(arg => arg.trim());

	console.log(splitArgs);

	let project = 'SageV2';
	let labels = [];
	let milestone = '';

	if (splitArgs.find(str => str.includes('project'))) {
		[, project] = splitArgs.find(str => str.includes('project=')).split('=');
	}

	if (splitArgs.find(str => str.includes('labels'))) {
		labels = splitArgs.find(str => str.includes('labels='))
			.split('=').slice(1).join().split(',').map(label => label.trim());
	}

	if (splitArgs.find(str => str.includes('milestone'))) {
		[, milestone] = splitArgs.find(str => str.includes('milestone=')).split('=');
	}
	return [title, project, labels, milestone];
}
