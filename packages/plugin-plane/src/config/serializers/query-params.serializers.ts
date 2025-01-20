import { defaultOrganizationId, currentTenantId } from '../credentials';

export const baseGetItemsWhereQuery = () => ({
	'where[organizationId]': defaultOrganizationId(),
	'where[tenantId]': currentTenantId()
});
