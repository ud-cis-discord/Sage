import { Db } from 'mongodb';
import { Command } from '@lib/types/Command';

declare module 'discord.js' {
	interface Client{
		mongo: Db
		commands: Collection<string, Command>;
	}
}
