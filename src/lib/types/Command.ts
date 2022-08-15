import { ROLES } from '@root/config';
import { ApplicationCommandOptionData, ApplicationCommandPermissionData, ApplicationCommandType, CommandInteraction, MessageContextMenuInteraction } from 'discord.js';


export abstract class Command {

	// members
	name: string;
	category: string;
	enabled: boolean;
	aliases?: Array<string>;
	description: string;
	usage?: string;
	extendedHelp?: string;
	runInDM?: boolean = true;
	runInGuild?: boolean = true;
	options?: ApplicationCommandOptionData[];
	type?: ApplicationCommandType;
	permissions?: ApplicationCommandPermissionData[] = [{
		id: ROLES.VERIFIED,
		type: 'ROLE',
		permission: true
	}];

	// functions
	abstract run(interaction: CommandInteraction | MessageContextMenuInteraction): Promise<unknown>;

}

export interface CompCommand {
	name: string,
	description: string,
	options: ApplicationCommandOptionData[]
}
