import { Message, MessageEmbed } from 'discord.js';
import { execSync } from 'child_process';
import { botMasterPerms } from '@lib/permissions';
import { homepage as github } from '@root/package.json';

export const description = 'Get info about the most recent commit that is currently running.';
export const extendedHelp = 'Merge commits and version bumps are ignored.';

export async function permissions(msg: Message): Promise<boolean> {
	return await botMasterPerms(msg);
}

export function run(msg: Message): Promise<Message> {
	const [hash, author, message, timestamp, branch] = getGitInfo();

	return msg.channel.send(new MessageEmbed()
		.setAuthor(author)
		.setTitle(message)
		.setDescription(`Commit [${hash.slice(0, 8)}](${github}/commit/${hash}) on ${branch}`)
		.setColor('#fbb848')
		.setTimestamp(new Date(timestamp)));
}


function getGitInfo(commitNumber = 0): Array<string> {
	const info = execSync(`cd ${__dirname} && git log --max-count=1 --skip=${commitNumber} --no-merges --format="%H%n%an%n%s%n%ci"` +
		' && git branch --show-current').toString().split('\n');

	if (info[2].toLowerCase() === 'version bump') {
		return getGitInfo(commitNumber + 1);
	}

	return info;
}
