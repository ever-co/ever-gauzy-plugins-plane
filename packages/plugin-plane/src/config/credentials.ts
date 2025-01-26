import {
	getCurrentEmployeeId,
	getCurrentTenantId,
	getCurrentUserId
} from '../modules/api-fetch/token.helper';
import { WorkspaceContextService } from '../modules/workspace/workspace-context.service';

export const apiSecretKeys = () => ({
	API_KEY: process.env.API_KEY,
	API_SECRET: process.env.API_SECRET,
	API_TOKEN: process.env.API_TOKEN
});

export const currentTenantId = () => {
	return getCurrentTenantId();
};

export const getCurrentOrganizationSlug = () => {
	return WorkspaceContextService.getCurrentWorkspaceSlug();
};

export const currentEmployeeId = () => {
	return getCurrentEmployeeId();
};

export const currentUserId = (token?: string) => {
	return getCurrentUserId(token);
};
