export enum SageInteractionType {
	POLL = 'P',
	RPS = 'RPS'
}

/**
 * {SageInteractionType} type - the type of interaction
 * { string}
 */
export interface SageComponentInteractionData {
	type: SageInteractionType,
	commandOwner: string,
	additionalData: string[]
}
