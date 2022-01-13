import { ActivityType, ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, Message } from 'discord.js';
import { BOT, DB } from '@root/config';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';

const args = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];
export default class extends Command {

	description = `Sets ${BOT.NAME}'s activity to the given status and content`;
	usage = '<status>|<content>';
	tempPermissions: ApplicationCommandPermissionData[] = [BOTMASTER_PERMS];
	//	botmaster perms

	options: ApplicationCommandOptionData[] = [
		{
			name: 'status',
			description: 'The activity status (ex: Playing).',
			type: 'STRING',
			required: true,
			choices: args.map((arg) => ({
				name: arg,
				value: arg
			}))
		},
		{
			name: 'content',
			description: 'The activity itself (ex: s;help).',
			type: 'STRING',
			required: true
		}
	]

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const bot = interaction.client;
		const content = interaction.options.getString('content');
		const type = interaction.options.getString('status').toUpperCase() as ActivityType;

		//	setting Sage's activity status in the guild
		bot.user.setActivity(content, { type });
		//	updating Sage's activity status in the database (so that it stays upon a restart)
		bot.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: bot.user.id },
			{ $set: { status: { type, content } } },
			{ upsert: true });

		//	this is just formatting the reply string
		const replyType = type[0] + type.slice(1).toLowerCase();
		interaction.reply(`Set ${BOT.NAME}'s activity to *${replyType} ${content}*`);
	}

	run(_msg: Message): Promise<void> { return; }

}
