import { CommandInteraction, MessageEmbed } from 'discord.js';
import { execSync } from 'child_process';
import { homepage as github } from '@root/package.json';
import { Command } from '@lib/types/Command';
export default class extends Command {

	description = 'Get info about the most recent commit that is currently running.';
	extendedHelp = 'Merge commits and version bumps are ignored.';

	// required for export default
	async run(): Promise<void> {
		return;
	}

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const [hash, author, message, timestamp, branch] = this.getGitInfo();

		const embed = new MessageEmbed()
			.setAuthor(author)
			.setTitle(message)
			.setDescription(`Commit [${hash.slice(0, 8)}](${github}/commit/${hash}) on ${branch}`)
			.setColor('#fbb848')
			.setTimestamp(new Date(timestamp));

		return interaction.reply({ embeds: [embed] });
	}

	getGitInfo(commitNumber = 0): Array<string> {
		const info = execSync(`cd ${__dirname} && git log --max-count=1 --skip=${commitNumber} --no-merges --format="%H%n%an%n%s%n%ci"` +
			' && git branch --show-current').toString().split('\n');

		if (info[2].toLowerCase().startsWith('version bump')) {
			return this.getGitInfo(commitNumber + 1);
		}

		return info;
	}

}
