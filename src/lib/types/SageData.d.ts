import { ExcludeEnum } from 'discord.js';
import { ActivityTypes } from 'discord.js/typings/enums';

export interface SageData {
	status: {
		type: ExcludeEnum<typeof ActivityTypes, 'CUSTOM'>;
		name: string;
	};
	commandSettings: Array<{ name: string, enabled: boolean }>;
}
