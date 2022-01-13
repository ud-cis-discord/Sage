import { ActivityType, ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction, Message } from 'discord.js';
import { BOT, DB } from '@root/config';
import { botMasterPerms, BOTMASTER_PERMS } from '@lib/permissions';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = `Sets ${BOT.NAME}'s activity to the given type and content`;
	usage = '<type>|<content>';
	aliases = ['setactivity'];
	tempPermissions: ApplicationCommandPermissionData[] = [BOTMASTER_PERMS];

	options: ApplicationCommandOptionData[] = [
		{
			name: 'status',
			description: 'The activity status (ex: PLAYING).',
			type: 'STRING',
			required: true
		},
		{
			name: 'content',
			description: 'The activity itself (ex: a game).',
			type: 'STRING',
			required: true
		}
	]

	async permissions(msg: Message): Promise<boolean> {
		return botMasterPerms(msg);
	}

	async tempRun(interaction: CommandInteraction): Promise<void> {
		const bot = interaction.client;
		const name = interaction.options.getString('content');
		const type = interaction.options.getString('status');
		bot.user.setActivity(name, { type });
		bot.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: bot.user.id },
			{ $set: { status: { type, name } } },
			{ upsert: true });
		return interaction.reply(`Set ${BOT.NAME}'s activity to *${type} ${name}*`);
	}

	async run(msg: Message, [type, name]: [ActivityType, string]): Promise<Message> {
		const bot = msg.client;
		bot.user.setActivity(name, { type });
		bot.mongo.collection(DB.CLIENT_DATA).updateOne(
			{ _id: bot.user.id },
			{ $set: { status: { type, name } } },
			{ upsert: true });
		return msg.channel.send(`Set ${BOT.NAME}'s activity to ${type} ${name}`);
	}

	argParser(_msg: Message, input: string): [ActivityType, string] {
		const [type, content] = input.split('|').map(arg => arg.trim());
		if (!type || !content) {
			throw `Usage: ${this.usage}`;
		}

		const upperType = type.toUpperCase() as ActivityType;
		const activities = ['PLAYING', 'STREAMING', 'LISTENING', 'WATCHING', 'COMPETING'];

		if (!activities.includes(upperType)) {
			throw `Invalid activity type ${type}, choose one of ${activities.map(a => a.toLowerCase()).join(', ')}.`;
		}

		return [upperType, content];
	}

}
