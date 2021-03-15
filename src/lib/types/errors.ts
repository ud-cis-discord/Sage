export class DatabaseError extends Error {

	constructor(message: string) {
		super(message);
		this.name = 'Database Error';
	}

}

export class CommandError extends Error {

	constructor(message: string) {
		super(message);
		this.name = 'Command Error';
	}

}
