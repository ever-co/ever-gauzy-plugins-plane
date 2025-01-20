import { EXTERNAL_API_MODE } from './constants';
import {
	getCurrentEmployeeId,
	getCurrentUserId
} from '../modules/api-fetch/token.helper';

export const apiSecretKeys = () => ({
	API_KEY: process.env.API_KEY,
	API_SECRET: process.env.API_SECRET
});

export const defaultTestToken = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.LOCAL_TOKEN
		: process.env.EXTERNAL_TOKEN;

export const defaultTestTenantId = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.LOCAL_TENANT_ID
		: process.env.EXTERNAL_TENANT_ID;

export const defaultOrganizationId = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.LOCAL_ORGANIZATION_ID
		: process.env.EXTERNAL_ORGANIZATION_ID;

export const defaultProjectId = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.LOCAL_PROJECT_ID
		: process.env.EXTERNAL_PROJECT_ID;

export const currentEmployeeIdId = () => {
	return getCurrentEmployeeId();
};

export const currentUserId = () => {
	return getCurrentUserId();
};
