import { SageComponentInteractionData, SageInteractionType } from '@lib/types/InteractionType';

export function getDataFromCustomId(customId: string): SageComponentInteractionData {
	const [commandType, owner, ...extra] = customId.split('_');
	if (!(commandType in SageInteractionType)) {
		throw 'Invalid type for component\'s customId!';
	}

	return {
		commandOwner: owner,
		type: commandType as SageInteractionType,
		additionalData: extra
	};
}

/**
 * Create a customId to use in the interaction handlers. It is up to the implementer to
 * make sure that additionalData is set and used correctly, as it is meant to be flexible.
 * @param {SageInteractionType} type Interaction Type
 * @param {string} owner Discord ID of the user that created the interaction
 * @param {string[]} additionalData Any additional data that you may want to store (button names, etc.)
 * @returns {string} the custom ID
 */
export function buildCustomId(type: SageInteractionType, owner: string, additionalData: string[]): string {
	if (owner.length !== 18) throw 'owner must be a 17 digit Discord ID';
	const customId = `${type}_${owner}_${additionalData.join('_')}`;
	if (customId.length > 100) {
		throw 'Custom ID must not exceed 100 characters. Shorten additional data field.';
	}
	return customId;
}
