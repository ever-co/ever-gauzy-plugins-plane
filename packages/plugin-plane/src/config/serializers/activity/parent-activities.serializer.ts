import { IActivityLog } from '@ever-gauzy/plugin-integration-plane-models';

/**
 * Transforms the activity log for parent task updates.
 *
 * @param {IActivityLog} activityLog - The activity log object containing the details of the update.
 * @returns An object containing the updated and previous parent IDs,
 * or undefined if the parent ID was not updated.
 */
export function parentActivityTransformer(
	activityLog: IActivityLog,
	parentTasks?: Map<string, any>
) {
	const { updatedFields, updatedValues, previousValues } = activityLog;

	// Check if 'parentId' is included in the updated fields.
	if (!updatedFields!.includes('parentId')) {
		return;
	}

	// Find the updated parent from the updated values.
	const updatedParent: any = updatedValues!.find(
		(value) => 'parentId' in value
	);
	const updatedEntity: any = updatedParent
		? updatedParent['parentId']
		: undefined;

	// Find the previous parent from the previous values.
	const previousParent = previousValues!.find((value) => 'parentId' in value);
	const previousEntity: any = previousParent
		? previousParent['parentId']
		: undefined;

	const formatParentName = (id?: string): string | undefined => {
		if (!id || !parentTasks) return undefined;
		const task = parentTasks.get(id);
		if (!task) return undefined;

		const codeOrName =
			task.project.code || task.project.name.slice(0, 4).toUpperCase();
		return `${codeOrName}-${task.number}`;
	};

	// Get the parent names if available
	const updatedParentName = formatParentName(updatedEntity);
	const previousParentName = formatParentName(previousEntity);

	// Return an object containing the updated and previous parent IDs.
	return {
		updatedEntity,
		previousEntity,
		updatedParentName,
		previousParentName
	};
}
