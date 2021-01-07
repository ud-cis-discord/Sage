export interface User {
	email: string;
	hash: string;
	discordId: string;
	count: number;
	isVerified: boolean;
	isStaff: boolean;
	roles: Array<string>;
}
