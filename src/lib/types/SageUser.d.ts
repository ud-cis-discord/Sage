export interface SageUser {
	email: string;
	hash: string;
	discordId: string;
	pii: boolean;
	count: number;
	exp: number;
	level: number;
	levelPings: boolean;
	isVerified: boolean;
	isStaff: boolean;
	roles: Array<string>;
	courses: Array<string>
}
