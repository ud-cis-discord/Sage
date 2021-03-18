import { Db } from 'mongodb';
import { Command } from '@lib/types/Command';
import { Octokit } from '@octokit/rest';

declare module 'discord.js' {
	interface Client{
		mongo: Db
		octokit: Octokit
		commands: Collection<string, Command>;
	}
}
