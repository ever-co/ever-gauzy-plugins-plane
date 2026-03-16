import {
	ID,
	IEmployeeSetting,
	IUser,
	IUserCreateInput,
	IUserOrganization,
	IUserProfile,
	RolesEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import { currentTenantId, currentUserId } from '../../credentials';
import { employeeSettingSerializer } from '../employee-properties';
import { roleTransformer } from '../workspace-organization';
import { actorDetailsTransformer } from './actor-details.helper';

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

	query['includeEmployee'] = true;

	if (relations) {
		relations.forEach((relation, i) => {
			query[`relations[${i}]`] = relation;
		});
	}
	return query;
}

export const getUserMeQueryParams = {
	includeEmployee: true,
	'[relations][0]': 'tenant'
};

/**
 * Transforms organization data into a standardized format with owner and member details
 * @param organizations - Array of organization entities with employee relationships
 * @returns Transformed organizations with owner info and member counts
 */
export function organizationsTranformer(
	userOrganizations: IUserOrganization[]
) {
	return userOrganizations.map((userOrganization) => {
		const organization = userOrganization?.organization!;
		const owner = userOrganization?.organization!.employees?.find(
			(employee) => {
				const employeeRole = employee.user!.role!.name;
				return (
					employeeRole === RolesEnum.SUPER_ADMIN ||
					employeeRole === RolesEnum.ADMIN ||
					employeeRole === RolesEnum.MANAGER
				);
			}
		);

		return {
			id: organization?.id,
			owner: actorDetailsTransformer(owner!),
			total_members: organization?.totalEmployees,
			// total_issues: organization.tasks.length,
			created_at: organization?.createdAt,
			current_plan: 'PRO',
			updated_at: organization?.updatedAt,
			deleted_at: organization?.deletedAt,
			is_on_trial: false,
			name: organization?.name,
			logo: organization?.imageUrl,
			slug: organization?.id,
			role: roleTransformer(userOrganization?.user!.role!),
			organization_size: organization?.minimumProjectSize || '11-50'
			// created_by: organization.createdBy,
			// updated_by: organization.updatedBy
		};
	});
}

/**
 * Transforms user data into a format suitable for /user/me endpoint response
 * @param user - User entity with employee relationship
 * @returns Transformed user data with basic profile information
 */
export function userMeTransformer(user: IUser) {
	return {
		id: user?.employee!.id,
		avatar: user?.imageUrl,
		cover_image: null,
		date_joined: user?.employee!.startedWorkOn,
		display_name: user?.name,
		email: user?.email,
		first_name: user?.firstName,
		last_name: user?.lastName,
		is_active: user?.isActive,
		is_bot: false,
		is_email_verified: user?.isEmailVerified,
		user_timezone: user?.timeZone || 'UTC',
		username: user?.username,
		is_password_autoset: false,
		last_login_medium: 'email'
	};
}

/**
 * Transforms user data into an extended profile format with preferences and settings
 * @param user - User entity with employee relationship
 * @returns Transformed user profile with theme, onboarding, and billing information
 */
export function userProfileTransformer(user: IUser): IUserProfile {
	return {
		id: user.id,
		created_at: user.createdAt,
		updated_at: user.updatedAt,
		theme: {},
		is_tour_completed: true,
		onboarding_step: {
			workspace_join: true,
			profile_complete: true,
			workspace_create: true,
			workspace_invite: true
		},
		use_case: 'Engineering',
		role: 'Individual contributor',
		is_onboarded: true,
		last_workspace_id: user.lastOrganizationId,
		billing_address_country: 'INDIA',
		billing_address: 'My Billing address',
		has_billing_address: true,
		company_name: user.tenant!.name,
		user: user.employee!.id
	};
}

/**
 * Transforms user profile update data into the format expected by the API
 * @param input - User profile data with snake_case properties
 * @returns Transformed input with camelCase properties for API consumption
 */
export function updateUserProfileInputTranformer(
	input: IUserProfile
): IUserCreateInput {
	return {
		firstName: input.first_name,
		lastName: input.last_name,
		imageUrl: input.avatar_url,
		lastOrganizationId: input.last_workspace_id,
		defaultOrganizationId: input.fallback_workspace_id,
		timeZone: input.user_timezone
	};
}

export function userSettingsTranformer(user: IUser) {
	return {
		id: user.employee!.id,
		email: user.email,
		workspace: {
			last_workspace_id: user.lastOrganizationId,
			last_workspace_slug: user.lastOrganizationId,
			fallback_workspace_id:
				user.defaultOrganizationId ?? user.employee!.organizationId,
			fallback_workspace_slug:
				user.defaultOrganizationId ?? user.employee!.organizationId,
			invites: user.invites
		}
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
	const defaultData = memberSetting?.defaultData as Record<string, any>;

	const {
		filters: defaultFilters = {},
		display_filters: defaultDisplayFilters = {},
		display_properties: defaultDisplayProperties = {}
	} = defaultData ?? {};

	const issue_props = defaultData ? defaultData.issue_props : {};

	return {
		id: currentUserId(),
		created_at: memberSetting?.createdAt,
		updated_at: memberSetting?.updatedAt,
		deleted_at: memberSetting?.deletedAt,
		role: roleTransformer(memberSetting?.employee!.user!.role!),
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
		user_info: actorDetailsTransformer(memberSetting?.employee),
		workspace_info: {
			id: memberSetting?.organizationId,
			slug: memberSetting?.organizationId,
			name: memberSetting?.organization!.name
		},
		member: employeeId
	};
}
