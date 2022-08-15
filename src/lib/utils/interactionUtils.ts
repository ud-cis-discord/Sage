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
 * @param {SageComponentInteractionData} data The data to build the customId with
 * @returns {string} the custom ID
 */
export function buildCustomId(data: SageComponentInteractionData): string {
	if (data.commandOwner.length !== 18) throw 'owner must be a 18 digit Discord ID';
	const customId = `${data.type}_${data.commandOwner}_${data.additionalData.join('_')}`;
	if (customId.length > 100) {
		throw 'Custom ID must not exceed 100 characters. Shorten additional data field.';
	}
	return customId;
}
