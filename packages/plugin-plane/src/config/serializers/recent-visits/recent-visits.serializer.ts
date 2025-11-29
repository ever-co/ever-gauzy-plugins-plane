import { ID } from '@plane-plugin/models';
import { currentTenantId, getCurrentOrganizationSlug } from '../../credentials';

/**
 * Builds a query object for fetching employee recent visits with optional filters and predefined relations.
 *
 * This function generates a query object formatted for APIs that accept filtering via
 * nested query parameters like `where[field]=value` and `relations[index]=relation`.
 *
 * @param {ID} employeeId - The ID of the employee to fetch recent visits for.
 * @returns {Record<string, any>} A query object that can be used in an HTTP request (e.g., for RESTful endpoints).
 */
export function getEmployeeRecentVisitsQuery(
	employeeId: ID
): Record<string, any> {
	const query: Record<string, any> = {
		organizationId: getCurrentOrganizationSlug(),
		tenantId: currentTenantId()
	};

	query['employeeId'] = employeeId;

	return query;
}
