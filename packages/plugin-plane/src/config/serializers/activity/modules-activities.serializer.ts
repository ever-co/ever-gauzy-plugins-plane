import { IActivityLog, IOrganizationProjectModule } from '@plane-plugin/models';

/**
 * Transforms the activity log to capture the modules that were added or removed
 * during the update of task's modules
 *
 * @param {IActivityLog} activityLog - The current activity log with updated values
 * @returns An object containing added and removed modules with their respective verb (created/deleted)
 */
export function modulesActivityTransformer(activityLog: IActivityLog) {
	const { updatedFields, updatedValues, previousValues } = activityLog;

	// Check if 'modules' field was updated
	if (!updatedFields.includes('modules')) {
		return null;
	}

	// Retrieve updated modules from 'updatedValues'
	const updatedEntities = updatedValues.find((value) => 'modules' in value);
	const updatedModules = updatedEntities
		? (updatedEntities['modules'] as any)
		: [];

	// Retrieve previous modules from 'previousValues'
	const previousEntities = previousValues.find((value) => 'modules' in value);
	const previousModules = previousEntities
		? (previousEntities['modules'] as any)
		: [];

	// Dermine modules that were added and removed
	const addedModules = getAddedModules(previousModules, updatedModules);
	const removedModules = getRemovedModules(previousModules, updatedModules);

	// Return the result, applying the verb to added and removed modules
	return {
		added:
			addedModules.length > 0
				? { modules: addedModules, verb: 'created' }
				: null,
		removed:
			removedModules.length > 0
				? { modules: removedModules, verb: 'deleted' }
				: null,
	};
}

/**
 * Finds the modules that were added in the update.
 *
 * @param {IOrganizationProjectModule[]} previousModules - The modules before update.
 * @param {IOrganizationProjectModule[]} updatedModules - The modules after update.
 * @returns {IOrganizationProjectModule[]} An array of added modules.
 */
function getAddedModules(
	previousModules: IOrganizationProjectModule[],
	updatedModules: IOrganizationProjectModule[],
): IOrganizationProjectModule[] {
	const previousSet = new Set(previousModules.map((module) => module.id));
	return updatedModules.filter((module) => !previousSet.has(module.id));
}

/**
 * Finds the modules that were removed in the update.
 *
 * @param {IOrganizationProjectModule[]} previousModules - The modules before update.
 * @param {IOrganizationProjectModule[]} updatedModules - The modules after update.
 * @returns {IOrganizationProjectModule[]} An array of removed modules.
 */
function getRemovedModules(
	previousModules: IOrganizationProjectModule[],
	updatedModules: IOrganizationProjectModule[],
): IOrganizationProjectModule[] {
	const updatedSet = new Set(updatedModules.map((module) => module.id));
	return previousModules.filter((module) => !updatedSet.has(module.id));
}
