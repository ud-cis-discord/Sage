import { Client, Collection } from 'discord.js';
import { Command } from '@lib/types/Command';

export class SageClient extends Client {

	public commands: Collection<string, Command>;

}
