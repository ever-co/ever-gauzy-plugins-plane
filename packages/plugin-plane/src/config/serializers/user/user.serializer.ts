import {
	ID,
	IEmployeeSetting,
	IOrganization,
	IUser,
	RolesEnum
} from '@plane-plugin/models';
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

/**
 * Transforms organization data into a standardized format with owner and member details
 * @param organizations - Array of organization entities with employee relationships
 * @returns Transformed organizations with owner info and member counts
 */
export function organizationsTranformer(organizations: IOrganization[]) {
	return organizations.map((organization) => {
		const owner = organization.employees.find((employee) => {
			const employeeRole = employee.user.role.name;
			return (
				employeeRole === RolesEnum.SUPER_ADMIN ||
				employeeRole === RolesEnum.ADMIN ||
				employeeRole === RolesEnum.MANAGER
			);
		});

		return {
			id: organization.id,
			owner: {
				id: owner?.id,
				first_name: owner?.user.firstName,
				last_name: owner?.user.lastName,
				avatar: owner?.user.imageUrl,
				is_bot: false,
				display_name: owner?.user.fullName
			},
			total_members: organization.employees.length,
			// total_issues: organization.ta.length,
			created_at: organization.createdAt,
			updated_at: organization.updatedAt,
			deleted_at: organization.deletedAt,
			name: organization.name,
			logo: organization.imageUrl,
			slug: organization.id,
			organization_size: organization.minimumProjectSize || '11-50'
			// created_by: organization.createdBy,
			// updated_by: organization.updatedBy
		};
	});
}

export function userMeTransformer(user: IUser) {
	return {
		id: user.employee.id,
		avatar: user.imageUrl,
		cover_image: null,
		date_joined: user.employee.startedWorkOn,
		display_name: user.name,
		email: user.email,
		first_name: user.firstName,
		last_name: user.lastName,
		is_active: user.isActive,
		is_bot: false,
		is_email_verified: user.isEmailVerified,
		user_timezone: user.timeZone,
		username: user.username,
		is_password_autoset: false,
		last_login_medium: 'email'
	};
}

/**
 * Serializes member properties with default settings and employee data
 * @param memberSetting - Employee settings containing default data and organization info
 * @param employeeId - The ID of the employee
 * @returns Serialized member properties with view, default, and issue props
 */
export function memberPropertiesSerializer(
	memberSetting: IEmployeeSetting,
	employeeId: ID
) {
	const {
		filters: defaultFilters,
		display_filters: defaultDisplayFilters,
		display_properties: defaultDisplayProperties
	} = memberSetting?.defaultData as Record<string, any>;

	const { issue_props } = memberSetting?.defaultData as Record<string, any>;

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
		workspace: memberSetting?.organizationId,
		member: employeeId
	};
}
