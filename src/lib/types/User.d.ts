export interface User {
	email: string;
	hash: string;
	discordId: string;
	pii: boolean;
	count: number;
	isVerified: boolean;
	roles: Array<string>;
}
