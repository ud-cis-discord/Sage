import { Message } from 'discord.js';


export abstract class Command {

	// members
	name: string;
	category: string;
	enabled: boolean;
	aliases?: Array<string>;
	description?: string;
	usage?: string;
	extendedHelp?: string;
	runInDM?: boolean;
	runInGuild?:boolean;

	// functions
	abstract run(msg: Message, args?: Array<unknown>): Promise<unknown>;
	permissions?(msg: Message): Promise<boolean>;
	argParser?(msg: Message, input: string): Promise<Array<unknown>> | Array<unknown>;

	// mutators

}
