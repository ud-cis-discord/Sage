export interface PVQuestion {
	owner: string;
	questionId: string;
	messageLink: string;
	type: 'private' | 'anonymous';
	threadId: string;
}
