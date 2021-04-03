import { Message } from 'discord.js';


export interface Command {
	run(msg: Message, args?: Array<unknown>): Promise<unknown>;
	name: string;
	category: string;
	enabled: boolean;
	aliases?: Array<string>;
	description?: string;
	usage?: string;
	extendedHelp?: string;
	runInDM?: boolean;
	runInGuild?:boolean;
	permissions?(msg: Message): boolean;
	argParser?(msg: Message, input: string): Array<unknown>;
}
