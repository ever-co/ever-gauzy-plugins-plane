import { IActivityLog, ITag } from '@plane-plugin/models';
import { manyToManyFieldActivityTransformer } from './many-to-many-field-activity.helper';

export function labelsActivityTransformer(activityLog: IActivityLog) {
	return manyToManyFieldActivityTransformer<ITag>(
		activityLog,
		'tags',
		getAddedTags,
		getRemovedTags,
		'added',
		'removed'
	);
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
