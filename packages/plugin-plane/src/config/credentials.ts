import { EXTERNAL_API_MODE } from './constants';
import {
	getCurrentEmployeeId,
	getCurrentTenantId,
	getCurrentUserId
} from '../modules/api-fetch/token.helper';

export const apiSecretKeys = () => ({
	API_KEY: process.env.API_KEY,
	API_SECRET: process.env.API_SECRET,
	API_TOKEN: process.env.API_TOKEN
});

export const currentTenantId = () => {
	return getCurrentTenantId();
};

export const defaultOrganizationId = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.LOCAL_ORGANIZATION_ID
		: process.env.EXTERNAL_ORGANIZATION_ID;

export const defaultProjectId = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.LOCAL_PROJECT_ID
		: process.env.EXTERNAL_PROJECT_ID;

export const currentEmployeeId = () => {
	return getCurrentEmployeeId();
};

export const currentUserId = () => {
	return getCurrentUserId();
};

export const defaultTestToken = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.LOCAL_TOKEN
		: process.env.EXTERNAL_TOKEN;
