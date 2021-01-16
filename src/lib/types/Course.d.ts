export interface Course {
	name: string;
	channels: {
		category: string;
		general: string;
		staff: string;
	}
	roles: {
		student: string;
		staff: string;
	}
	assignments: Array<string>;
}
