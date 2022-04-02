export interface Poll {
	question: string;
	results: PollResult[]
	owner: string;
	expires: Date;
	message: string;
	channel: string;
	type: 'Single' | 'Multiple'
}

export interface PollResult {
	option: string;
	users: string[];
}
