export interface User {
	email: string;
	hash: string;
	discordId: string;
	count: number;
	isVerified: boolean;
	roles: Array<string>;
}
