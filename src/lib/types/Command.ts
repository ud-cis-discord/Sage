import { ROLES } from '@root/config';
import { ApplicationCommandOptionData, ApplicationCommandPermissions, ApplicationCommandPermissionType, ApplicationCommandType, CommandInteraction, InteractionResponse,
	Message,
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
	abstract run(interaction: CommandInteraction | MessageContextMenuCommandInteraction): Promise<InteractionResponse<boolean> | void | Message<boolean>>;
	// void: Does not return anything (i.e. no interaction; rarely used)
	// InteractionResponse<boolean>: usually means 'return interaction.reply('Text');
	// Message<boolean>: usually means 'return interaction.followUp('text');

}

export interface CompCommand {
	name: string,
	description: string,
	options: ApplicationCommandOptionData[]
}
