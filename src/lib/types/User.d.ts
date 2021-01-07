import { ObjectId } from 'mongodb';

export interface User {
	_id: ObjectId;
	email: string;
	hash: string;
	discordId: string;
	count: number;
	isVerified: boolean;
	isStaff: boolean;
	roles: Array<string>;
}
