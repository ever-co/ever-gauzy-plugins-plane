import {
	getCurrentEmployeeId,
	getCurrentTenantId,
	getCurrentUserId
} from '../modules/api-fetch/token.helper';
import { WorkspaceContextService } from '../modules/workspace/workspace-context.service';

/**
 * @description Get the API secret keys
 * @returns {Object} The API secret keys
 */
export const apiSecretKeys = () => ({
	API_KEY: process.env.API_KEY,
	API_SECRET: process.env.API_SECRET,
	API_TOKEN: process.env.API_TOKEN
});

/**
 * @description Get the current tenant ID
 * @returns {string} The current tenant ID
 */
export const currentTenantId = () => {
	return getCurrentTenantId();
};

/**
 * @description Get the current organization slug
 * @returns {string} The current organization slug
 */
export const getCurrentOrganizationSlug = () => {
	return WorkspaceContextService.getCurrentWorkspaceSlug();
};

/**
 * @description Get the current employee ID
 * @returns {string} The current employee ID
 */
export const currentEmployeeId = () => {
	return getCurrentEmployeeId();
};

/**
 * @description Get the current user ID
 * @param {string} token - The token
 * @returns {string} The current user ID
 */
export const currentUserId = (token?: string) => {
	return getCurrentUserId(token);
};
