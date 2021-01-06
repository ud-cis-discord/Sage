import { Message } from 'discord.js';


export interface Command {
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	run(msg: Message, args?: Array<any>): any;
	name: string;
	category: string;
	aliases?: Array<string>;
	decription?: string;
	useage?: string;
	extendedHelp?: string;
	permissions?(msg: Message): boolean;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	argParser?(msg: Message, input: string): Array<any>;
}
