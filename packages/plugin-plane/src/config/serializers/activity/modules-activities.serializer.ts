import { IActivityLog, IOrganizationProjectModule } from '@plane-plugin/models';
import { manyToManyFieldActivityTransformer } from './many-to-many-field-activity.helper';

export function modulesActivityTransformer(activityLog: IActivityLog) {
	return manyToManyFieldActivityTransformer<IOrganizationProjectModule>(
		activityLog,
		'modules',
		getAddedModules,
		getRemovedModules,
		'created',
		'deleted',
	);
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
