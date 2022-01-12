/* eslint-disable camelcase */
import { adminPerms } from '@lib/permissions';
import { RequestError } from '@octokit/types';
import { BOT, GITHUB_PROJECT } from '@root/config';
import { Command } from '@lib/types/Command';
import { Message } from 'discord.js';

export default class extends Command {

	usage = '<title>|[options]';
	description = `Creates an issue in ${BOT.NAME}' repository.`;
	extendedHelp = `You must pass in an issue title. Flags can be any of:
	--labels=[comma, separated, list]\n--milestone=[milestone number]\n--project=[project (defaults to SageV2)]]`;

	async permissions(msg: Message): Promise<boolean> {
		return adminPerms(msg);
	}

	async run(msg: Message, [title, project, labels, milestone, body]: [string, string, string[], string, string]): Promise<Message | void> {
		const newIssue = await msg.client.octokit.issues.create({
			owner: 'ud-cis-discord',
			repo: project,
			title: title,
			milestone: milestone || undefined,
			labels: labels,
			body: `${body}\n\n<sub>Created by ${msg.member.displayName} via ${BOT.NAME}</sub>`
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

	async argParser(_msg: Message, input: string): Promise<Array<string | string[]>> {
		const [title, ...args] = input.split('--');
		if (!title) throw `Usage: ${this.usage}`;

		const splitArgs = args.map(arg => arg.trim());

		let project = GITHUB_PROJECT;
		let labels = [];
		let milestone = '';
		let body = '';

		if (splitArgs.find(str => str.includes('project'))) {
			[, project] = splitArgs.find(str => str.includes('project')).split('=');
			if (!project) throw `Invalid format for project, more help:\n${this.extendedHelp}`;
		}

		if (splitArgs.find(str => str.includes('labels'))) {
			labels = splitArgs.find(str => str.includes('labels'))
				.split('=').slice(1).join().split(',').map(label => label.trim());
			if (!labels) throw `Invalid format for labels, more help:\n${this.extendedHelp}`;
		}

		if (splitArgs.find(str => str.includes('milestone'))) {
			[, milestone] = splitArgs.find(str => str.includes('milestone')).split('=');
			if (!milestone) throw `Invalid format for milestone name, more help:\n${this.extendedHelp}`;
		}

		if (splitArgs.find(str => str.includes('body'))) {
			[, body] = splitArgs.find(str => str.includes('body')).split('=');
			if (!body) throw `Invalid format for body, more help:\n${this.extendedHelp}`;
		} else if (splitArgs.find(str => str.includes('description'))) {
			[, body] = splitArgs.find(str => str.includes('description')).split('=');
			if (!body) throw `Invalid format for description, more help:\n${this.extendedHelp}`;
		}
		return [title, project, labels, milestone, body];
	}

}
