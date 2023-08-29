import { ActivityType, ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction } from 'discord.js';
import { BOT, DB } from '@root/config';
import { BOTMASTER_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';

const ACTIVITIES = ['Playing', 'Streaming', 'Listening', 'Watching', 'Competing'];

export default class extends Command {

	description = `Sets ${BOT.NAME}'s activity to the given status and content`;
	permissions: ApplicationCommandPermissionData[] = BOTMASTER_PERMS;

	options: ApplicationCommandOptionData[] = [
		{
			name: 'status',
			description: 'The activity status.',
			type: 'STRING',
			required: true,
			choices: ACTIVITIES.map((activity) => ({
				name: activity,
				value: activity
			}))
		},
		{
			name: 'content',
			description: 'The activity itself (ex: /help).',
			type: 'STRING',
			required: true
		}
	]

	async run(interaction: CommandInteraction): Promise<void> {
		const bot = interaction.client;
		const content = interaction.options.getString('content');
		const type = interaction.options.getString('status').toUpperCase() as ActivityType;

		// setting Sage's activity status in the guild
		// eslint-disable-next-line @typescript-eslint/ban-ts-comment
		// @ts-ignore - idk why TypeScript is complaining about this when it's literally the correct type
		bot.user.setActivity(content, { type });
		//	updating Sage's activity status in the database (so that it stays upon a restart)
		bot.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: bot.user.id },
			{ $set: { status: { type, content } } },
			{ upsert: true });

		interaction.reply({ content: `Set ${BOT.NAME}'s activity to *${type} ${content}*`, ephemeral: true });
	}

}
