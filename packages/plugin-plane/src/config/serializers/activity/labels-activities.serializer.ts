import { IActivityLog, ITag } from '@plane-plugin/models';

/**
 * Transforms the activity log to capture the tags that were added or removed
 * during the update of task's tags
 *
 * @param activityLog - The current activity log  with updated values
 * @returns An object containing added tags, removed tags and their respective verb (added/removed)
 */
export function labelsActivityTransformer(activityLog: IActivityLog) {
	const { updatedFields, updatedValues, previousValues } = activityLog;

	// Check if 'tags' field was updated
	if (!updatedFields.includes('tags')) {
		return null;
	}

	// Retrieve updated tags from 'updatedValues'
	const updatedEntities = updatedValues.find((value) => 'tags' in value);
	const updatedTags = updatedEntities ? (updatedEntities['tags'] as any) : [];

	// Retrieve previous tags from 'previousValues'
	const previousEntities = previousValues.find((value) => 'tags' in value);
	const previousTags = previousValues
		? (previousEntities['tags'] as any)
		: [];

	// Determine tags that were added and removed
	const addedTags = getAddedTags(previousTags, updatedTags);
	const removedTags = getRemovedTags(previousTags, updatedTags);

	// Return the result, applying the verb to added and removed tags
	return {
		added: addedTags.length > 0 ? { tags: addedTags, verb: 'added' } : null,
		removed:
			removedTags.length > 0
				? { tags: removedTags, verb: 'removed' }
				: null,
	};
}

/**
 * Finds the tags that were added in the update.
 *
 * @param previousTags - The tags before update.
 * @param updatedTags - The tags after update.
 * @returns An array of added tags.
 */
function getAddedTags(previousTags: ITag[], updatedTags: ITag[]): ITag[] {
	const previousSet = new Set(previousTags.map((tag) => tag.id));
	return updatedTags.filter((tag) => !previousSet.has(tag.id));
}

/**
 * Finds the tags that were removed in the update.
 *
 * @param previousTags - The tags before update.
 * @param updatedTags - The tags after update.
 * @returns An array of removed tags.
 */
function getRemovedTags(previousTags: ITag[], updatedTags: ITag[]): ITag[] {
	const updatedSet = new Set(updatedTags.map((tag) => tag.id));
	return previousTags.filter((tag) => !updatedSet.has(tag.id));
}
