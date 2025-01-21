import { ID, IEmployeeSetting } from '@plane-plugin/models';
import { currentTenantId, currentUserId } from '../../credentials';
import { employeeSettingSerializer } from '../employee-properties';

/**
 * Generates query parameters for fetching user organizations
 * @param relations - Optional array of relation names to include in the query
 * @returns An object containing query parameters including tenant and user IDs, and optional relations
 */
export function getUserOrganizationsQueryParams(
	relations?: string[]
): Record<string, any> {
	const query: Record<string, any> = {
		'where[tenantId]': currentTenantId(),
		'where[userId]': currentUserId()
	};

	if (relations) {
		relations.forEach((relation, i) => {
			query[`relations[${i}]`] = relation;
		});
	}
	return query;
}

export function memberPropertiesSerializer(
	memberSetting: IEmployeeSetting,
	employeeId: ID
) {
	const {
		filters: defaultFilters,
		display_filters: defaultDisplayFilters,
		display_properties: defaultDisplayProperties
	} = memberSetting.defaultData as Record<string, any>;

	const { issue_props } = memberSetting.defaultData as Record<string, any>;

	return {
		id: currentUserId(),
		created_at: '2024-08-13T11:47:19.039549Z',
		updated_at: '2024-08-13T11:47:19.039558Z',
		deleted_at: null,
		role: 20,
		company_role: '',
		view_props: {
			...employeeSettingSerializer(memberSetting)
		},
		default_props: {
			filters: defaultFilters,
			display_filters: defaultDisplayFilters,
			display_properties: defaultDisplayProperties
		},
		issue_props,
		is_active: true,
		created_by: employeeId,
		updated_by: employeeId,
		workspace: memberSetting.organizationId,
		member: employeeId
	};
}
