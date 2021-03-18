import { adminPerms } from '@lib/permissions';
import { Message } from 'discord.js';

export const usage = '<title>|[args]';
export const extendedHelp = `You must pass in an issue title. Flags can be any of:
--labels=[comma, separated, list]\n--milestone=[milestone]\n--project=[project (defaults to SageV2)]]`;

export async function permissions(msg: Message): Promise<boolean> {
	return await adminPerms(msg);
}

export async function run(msg: Message, [title, project, labels, milestone]: [string, string, string[], string]): Promise<Message | void> {
	const issueResp = await msg.client.octokit.issues.create({
		owner: 'ud-cis-discord',
		repo: 'bot',
		title: title
		// milestone: milestone,
		// labels: labels
	});

	msg.channel.send(`I've created your issue at <${issueResp.data.html_url}>`);
}

export async function argParser(msg: Message, input: string): Promise<Array<string | string[]>> {
	const [title, args] = input.split('|');
	if (!title) throw 'you must include a title for the issue.';

	const splitArgs = args.split('--').map(arg => arg.trim());

	let project = splitArgs.find(str => str.includes('project'));
	[, project] = project.split('=') || undefined;

	const labels = splitArgs.find(str => str.includes('labels')).split('=')[1]
		.split(',').map(label => label.trim()) || undefined;

	// const project = splitArgs.find(arg => arg.includes('project')).split('-')[1] || 'bot';
	// const labels = splitArgs.find(arg => arg.includes('labels')).split('-').slice(1) || undefined;
	// const milestone = splitArgs.find(arg => arg.includes('milestone')).split('-')[1] || undefined;
	// const priority = splitArgs.find(arg => arg.includes('priority') && priorities
	// .map(pri => pri.toLowerCase()).includes(arg.split('-')[1].toLowerCase())) || undefined;
	// if (priority) {
	// labels.push(priorities.find(pri => pri.toLowerCase() === priority.toLowerCase()));
	// }
	console.log(title);
	return [title, project, labels, undefined];
}
