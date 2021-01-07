export interface SageUser {
	email: string;
	hash: string;
	discordId: string;
	pii: boolean;
	count: number;
	isVerified: boolean;
	isStaff: boolean;
	roles: Array<string>;
}
