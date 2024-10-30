import { IActivityLog } from '@plane-plugin/models';

/**
 * Transforms the activity log to capture the members that were added or removed
 * during the update of a task's members.
 *
 * @param activityLog - The current activity log with updated values.
 * @returns An object containing added members, removed members, and their respective verb (added/removed).
 */
export function assigneesActivityTransformer(activityLog: IActivityLog) {
	const { updatedFields, updatedValues, previousValues } = activityLog;

	// Check if 'members' field was updated
	if (!updatedFields.includes('members')) {
		return null;
	}

	// Retrieve updated members from updatedValues
	const updatedEntities = updatedValues.find((value) => 'members' in value);
	const updatedMembers = updatedEntities
		? (updatedEntities['members'] as any)
		: [];

	// Retrieve previous members from previousValues
	const previousEntities = previousValues.find((value) => 'members' in value);
	const previousMembers = previousEntities
		? (previousEntities['members'] as any)
		: [];

	// Determine members that were added and removed
	const addedMembers = getAddedMembers(previousMembers, updatedMembers);
	const removedMembers = getRemovedMembers(previousMembers, updatedMembers);

	// Return the result, applying the verb to added and removed members
	return {
		added:
			addedMembers.length > 0
				? { members: addedMembers, verb: 'added' }
				: null,
		removed:
			removedMembers.length > 0
				? { members: removedMembers, verb: 'removed' }
				: null,
	};
}

/**
 * Finds the members that were added in the update.
 *
 * @param previousMembers - The members before the update.
 * @param updatedMembers - The members after the update.
 * @returns An array of added members.
 */
function getAddedMembers(previousMembers: any[], updatedMembers: any[]): any[] {
	const previousSet = new Set(previousMembers.map((member) => member.id));
	const updated = updatedMembers.filter(
		(member) => !previousSet.has(member.id),
	);
	return updated;
}

/**
 * Finds the members that were removed in the update.
 *
 * @param previousMembers - The members before the update.
 * @param updatedMembers - The members after the update.
 * @returns An array of removed members.
 */
function getRemovedMembers(
	previousMembers: any[],
	updatedMembers: any[],
): any[] {
	const updatedSet = new Set(updatedMembers.map((member) => member.id));
	const previous = previousMembers.filter(
		(member) => !updatedSet.has(member.id),
	);
	return previous;
}
