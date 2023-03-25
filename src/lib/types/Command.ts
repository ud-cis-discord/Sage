import { ROLES } from '@root/config';
import { ApplicationCommandOptionData, ApplicationCommandPermissions, ApplicationCommandPermissionType, ApplicationCommandType, CommandInteraction, InteractionResponse,
	MessageContextMenuCommandInteraction } from 'discord.js';


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
	permissions?: ApplicationCommandPermissions[] = [{
		id: ROLES.VERIFIED,
		type: ApplicationCommandPermissionType.Role,
		permission: true
	}];

	// functions
	abstract run(interaction: CommandInteraction | MessageContextMenuCommandInteraction): Promise<InteractionResponse<boolean> | void>;

}

export interface CompCommand {
	name: string,
	description: string,
	options: ApplicationCommandOptionData[]
}
