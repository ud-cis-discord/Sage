import { ActivityType } from 'discord.js';

export interface SageData {
	status: {
		type: ActivityType;
		name: string;
	};
	commandSettings: Array<{ name: string, enabled: boolean }>;
}
