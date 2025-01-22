import { defaultOrganizationId, defaultTestTenantId } from '../credentials';

export const baseGetItemsWhereQuery = (): Record<string, string> => ({
	'where[organizationId]': defaultOrganizationId(),
	'where[tenantId]': defaultTestTenantId()
});
