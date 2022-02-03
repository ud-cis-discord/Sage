import { ApplicationCommand, CommandInteraction } from 'discord.js';

export class DatabaseError extends Error {

	constructor(message: string) {
		super(message);
		this.name = 'Database Error';
	}

}

export class CommandError extends Error {

	interaction?: CommandInteraction;
	command?: ApplicationCommand;

	constructor(error: Error, interaction: CommandInteraction) {
		super();
		this.name = error.name;
		this.message = error.message;
		this.stack = error.stack;
		this.interaction = interaction;
		this.command = interaction?.command;
	}

}
