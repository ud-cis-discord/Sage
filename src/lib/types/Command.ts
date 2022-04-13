import { ROLES } from '@root/config';
import { ApplicationCommandOption, ApplicationCommandOptionData, ApplicationCommandPermissionData,
	ApplicationCommandSubCommand,
	ApplicationCommandSubCommandData, ApplicationCommandSubGroup, ApplicationCommandSubGroupData, CommandInteraction } from 'discord.js';


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
	options?: NonSubCommandOptionData[];
	permissions?: ApplicationCommandPermissionData[] = [{
		id: ROLES.VERIFIED,
		type: 'ROLE',
		permission: true
	}];

	// functions
	abstract run(interaction: CommandInteraction): Promise<unknown>;

}

export type NonSubCommandOptionData = Exclude<ApplicationCommandOptionData, ApplicationCommandSubCommandData | ApplicationCommandSubGroupData>;
export type NonSubCommandOption = Exclude<ApplicationCommandOption, ApplicationCommandSubCommand | ApplicationCommandSubGroup>;

export interface CompCommand {
	name: string,
	description: string,
	options: ApplicationCommandOption[]
}
