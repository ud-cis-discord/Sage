import { ActivityType } from 'discord.js';

export interface SageData {
	status: {
		type: ActivityType;
		name: string;
	};
	commandStatus: Array<{ command: string, enabled: boolean }>;
}
