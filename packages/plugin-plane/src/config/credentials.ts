import {
	getCurrentEmployeeId,
	getCurrentTenantId,
	getCurrentUserId
} from '../modules/api-fetch/token.helper';
import { WorkspaceContextService } from '../modules/workspace/workspace-context.service';
import { PlaneConfigRegistry } from '../plane-config.registry';

/**
 * @description Get the API secret keys
 * @returns The API secret keys
 */
export const apiSecretKeys = () => ({
	API_KEY: PlaneConfigRegistry.apiKey,
	API_SECRET: PlaneConfigRegistry.apiSecret,
	API_TOKEN: PlaneConfigRegistry.apiToken
});

/**
 * @description Get the current tenant ID
 * @returns The current tenant ID
 */
export const currentTenantId = () => {
	return getCurrentTenantId();
};

/**
 * @description Get the current organization slug
 * @returns The current organization slug
 */
export const getCurrentOrganizationSlug = () => {
	return WorkspaceContextService.getCurrentWorkspaceSlug();
};

/**
 * @description Get the current employee ID
 * @returns The current employee ID
 */
export const currentEmployeeId = () => {
	return getCurrentEmployeeId();
};

/**
 * @description Get the current user ID
 * @param {string} token - The token
 * @returns The current user ID
 */
export const currentUserId = (token?: string) => {
	return getCurrentUserId(token);
};
