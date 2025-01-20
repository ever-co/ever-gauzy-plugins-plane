import { currentTenantId, getCurrentOrganizationSlug } from '../credentials';

export const baseGetItemsWhereQuery = () => ({
	'where[organizationId]': getCurrentOrganizationSlug(),
	'where[tenantId]': currentTenantId()
});
