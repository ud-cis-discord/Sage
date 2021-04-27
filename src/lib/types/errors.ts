import { Message } from 'discord.js';

export class DatabaseError extends Error {

	constructor(message: string) {
		super(message);
		this.name = 'Database Error';
	}

}

export class CommandError extends Error {

	msgLink?: string;
	msgContent?: string;

	constructor(error: Error, msg: Message) {
		super();
		this.name = error.name;
		this.message = error.message;
		this.stack = error.stack;
		this.msgLink = msg.url;
		this.msgContent = msg.content;
	}

}
