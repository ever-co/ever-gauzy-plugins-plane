import { IActivityLog } from '@plane-plugin/models';

/**
 * Transforms the activity log for task status updates.
 *
 * @param {IActivityLog} activityLog - The activity log object containing the details of the update.
 * @returns An object containing the updated and previous task status IDs,
 * or undefined if the task status ID was not updated.
 */
export function statusActivityTransformer(activityLog: IActivityLog) {
	const { updatedFields, updatedValues, previousValues } = activityLog;

	// Check if 'taskStatusId' is included in the updated fields.
	if (!updatedFields.includes('taskStatusId')) {
		return;
	}

	// Find the updated status from the updated values.
	const updatedStatus = updatedValues.find(
		(value) => 'taskStatusId' in value
	);
	const updatedEntity = updatedStatus
		? updatedStatus['taskStatusId']
		: undefined;

	// Find the previous status from the previous values.
	const previousStatus = previousValues.find(
		(value) => 'taskStatusId' in value
	);
	const previousEntity = previousStatus
		? previousStatus['taskStatusId']
		: undefined;

	// Return an object containing the updated and previous task status IDs.
	return { updatedEntity, previousEntity };
}
