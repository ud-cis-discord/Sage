export interface Counter {
	count: number;
	lastSendId: string;
	uniqueParticipants: string[];
	startDate: number;
	piece: 'counting';
}
