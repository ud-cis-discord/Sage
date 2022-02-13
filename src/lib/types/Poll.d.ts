export interface Poll {
	question: string;
	results: [string, number][]
	owner: string;
	expires: Date;
	message: string;
	channel: string;
}
