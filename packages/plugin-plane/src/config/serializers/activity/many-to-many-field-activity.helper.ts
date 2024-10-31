import { IActivityLog } from '@plane-plugin/models';
export interface ILog {
	added: {
		verb: string;
		[x: string]: any;
	};
}
/**
 * Transforms the activity log to capture the items (modules/tags) that were added or removed
 * during the update of task's fields (like modules or tags).
 *
 * @param activityLog - The current activity log with updated values
 * @param fieldName - The name of the field to check for updates (e.g., 'modules' or 'tags')
 * @param getAddedItems - A function to determine the added items
 * @param getRemovedItems - A function to determine the removed items
 * @param verbAdded - The verb to use for added items (e.g., 'created', 'added')
 * @param verbRemoved - The verb to use for removed items (e.g., 'deleted', 'removed')
 * @returns An object containing added and removed items with their respective verb
 */
export function manyToManyFieldActivityTransformer<T>(
	activityLog: IActivityLog,
	fieldName: string,
	getAddedItems: (previousItems: T[], updatedItems: T[]) => T[],
	getRemovedItems: (previousItems: T[], updatedItems: T[]) => T[],
	verbAdded: string,
	verbRemoved: string,
): {
	added: { [x: string]: any; verb: string } | null;
	removed: { [x: string]: any; verb: string } | null;
} {
	const { updatedFields, updatedValues, previousValues } = activityLog;

	// Check if the field was updated
	if (!updatedFields.includes(fieldName)) {
		return null;
	}

	// Retrieve updated items from 'updatedValues'
	const updatedEntities = updatedValues.find((value) => fieldName in value);
	const updatedItems = updatedEntities
		? (updatedEntities[fieldName] as T[])
		: [];

	// Retrieve previous items from 'previousValues'
	const previousEntities = previousValues.find((value) => fieldName in value);
	const previousItems = previousEntities
		? (previousEntities[fieldName] as T[])
		: [];

	// Determine items that were added and removed
	const addedItems = getAddedItems(previousItems, updatedItems);
	const removedItems = getRemovedItems(previousItems, updatedItems);

	// Return the result, applying the verbs to added and removed items
	return {
		added:
			addedItems.length > 0
				? { [fieldName]: addedItems, verb: verbAdded }
				: null,
		removed:
			removedItems.length > 0
				? { [fieldName]: removedItems, verb: verbRemoved }
				: null,
	};
}
