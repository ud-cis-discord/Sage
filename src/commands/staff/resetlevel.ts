import { ApplicationCommandOptionData, ApplicationCommandOptionType, ApplicationCommandPermissions, ChatInputCommandInteraction, InteractionResponse } from 'discord.js';
import { ADMIN_PERMS, STAFF_PERMS } from '@lib/permissions';
import { SageUser } from '@lib/types/SageUser';
import { DatabaseError } from '@lib/types/errors';
import { DB } from '@root/config';
import { Command } from '@lib/types/Command';

export default class extends Command {

	description = 'Resets a given user\'s message count.';
	extendedHelp = `Using with no value will reset to 0. A positive integer will
	set their message count and a negative will subtract that from their total`;
	runInDM = false;
	permissions: ApplicationCommandPermissions[] = [STAFF_PERMS, ADMIN_PERMS];
	options: ApplicationCommandOptionData[] = [
		{
			name: 'user',
			description: 'The user whose message count will be edited',
			type: ApplicationCommandOptionType.User,
			required: true
		},
		{
			name: 'value',
			description: 'value to use (positive to set, negative to subtract, none to set to 0)',
			type: ApplicationCommandOptionType.Integer,
			required: false
		}
	];

	async run(interaction: ChatInputCommandInteraction): Promise<InteractionResponse<boolean> | void> {
		const user = interaction.options.getUser('user');
		const amount = interaction.options.getInteger('value') || 0;
		const entry: SageUser = await interaction.client.mongo.collection(DB.USERS).findOne({ discordId: user.id });

		if (!entry) {
			throw new DatabaseError(`User ${user.username} (${user.id}) not in database`);
		}

		let retStr: string;

		if (amount < 0) {
			entry.count += amount;
			if (entry.count < 0) {
				entry.count = 0;
				retStr = `Subtracted ${amount * -1} from ${user.username}'s message count (bottomed out at 0).`;
			} else {
				retStr = `Subtracted ${amount * -1} from ${user.username}'s message count.`;
			}
		} else {
			entry.count = amount;
			retStr = `Set ${user.username}'s message count to ${amount}.`;
		}

		await interaction.client.mongo.collection(DB.USERS).updateOne(
			{ discordId: user.id },
			{ $set: { count: entry.count } });

		return interaction.reply({ content: retStr, ephemeral: true });
	}


}
