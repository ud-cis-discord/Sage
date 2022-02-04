import { ROLES } from '@root/config';
import { ApplicationCommandOptionData, ApplicationCommandPermissionData, CommandInteraction } from 'discord.js';


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
	permissions?: ApplicationCommandPermissionData[] = [{
		id: ROLES.VERIFIED,
		type: 'ROLE',
		permission: true
	}];

	// functions
	abstract run(interaction: CommandInteraction): Promise<unknown>;

}

export interface CompCommand {
	name: string,
	description: string,
	options: ApplicationCommandOptionData[]
}
