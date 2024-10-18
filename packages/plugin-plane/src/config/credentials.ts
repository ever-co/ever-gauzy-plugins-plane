import { EXTERNAL_API_MODE } from './constants';

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

export const defaultEmployeeId = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.LOCAL_EMPLOYEE_ID
		: process.env.EXTERNAL_EMPLOYEE_ID;

export const defaultUserId = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.LOCAL_USER_ID
		: process.env.EXTERNAL_USER_ID;
