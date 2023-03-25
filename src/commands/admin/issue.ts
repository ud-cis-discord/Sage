import { ADMIN_PERMS } from '@lib/permissions';
import { RequestError } from '@octokit/types';
import { BOT, GITHUB_PROJECT } from '@root/config';
import { Command } from '@lib/types/Command';
import { ApplicationCommandOptionData, ApplicationCommandPermissions, CommandInteraction } from 'discord.js';

export default class extends Command {

	description = `Creates an issue in ${BOT.NAME}'s repository.`;
	permissions: ApplicationCommandPermissions[] = [ADMIN_PERMS];

	options: ApplicationCommandOptionData[] = [{
		name: 'title',
		description: 'What\'s the issue?',
		type: ApplicationCommandOptionType.String,
		required: true
	},
	{
		name: 'labels',
		description: 'The issue labels, in a comma-separated list (if multiple).',
		type: ApplicationCommandOptionType.String,
		required: false
	},
	{
		name: 'body',
		description: 'The issue body',
		type: ApplicationCommandOptionType.String,
		required: false
	}]

	async run(interaction: CommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const title = (interaction.options as CommandInteractionOptionResolver).getString('title');
		const label = (interaction.options as CommandInteractionOptionResolver).getString('labels');
		const body = (interaction.options as CommandInteractionOptionResolver).getString('body');

		const labels = label ? label.split(', ') : [];

		const newIssue = await interaction.client.octokit.issues.create({
			owner: 'ud-cis-discord',
			repo: GITHUB_PROJECT,
			title: title,
			labels: labels,
			body: body || `\n\n<sub>Created by ${interaction.user.username} via ${BOT.NAME}</sub>`
		}).catch(response => {
			console.log(response);
			let errormsg = '';
			const { errors } = response as RequestError;
			errors.forEach((error: { code; field; }) => {
				errormsg += `Value ${error.code} for field ${error.field}.\n`;
			});
			interaction.reply({ content: `Issue creation failed. (HTTP Error ${response.status})
			\`\`\`diff
			-${errormsg}\`\`\``, ephemeral: true });
		});
		if (newIssue) {
			return interaction.reply(`I've created your issue at <${newIssue.data.html_url}>`);
		} else {
			return interaction.reply('Something went horribly wrong with issue creation! Blame Josh.');
		}
	}

}
