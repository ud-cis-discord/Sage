import { Client, Collection } from 'discord.js';
import { Db } from 'mongodb';
import { Command } from '@lib/types/Command';

export class SageClient extends Client {

	public commands: Collection<string, Command>;
	public mongo: Db;

}
