import { currentEmployeeId } from '../../credentials';
import { employeeSettingSerializer } from '../employee-properties';
import { getTaskCounts } from '../modules';
import { extractMemberIds } from '../projects';
import { actorDetailsTransformer } from '../user';
import {
	IRole,
	ITask,
	IWorkspaceUserInfo,
	RolesEnum,
	TaskPriorityEnum,
	IUserPriorityDistribution,
	IUserProjectData,
	ID,
	IOrganizationProject,
	IUserProjectsDataResponse,
	IUserProfileData,
	EmployeeSettingTypeEnum,
	BaseEntityEnum,
	IEmployeeSetting,
	IEmployee,
	IOrganization,
	ICreateWorkSpace,
	IOrganizationCreateInput,
	CurrenciesEnum,
	IWorkspaceInfo
} from '@ever-gauzy/plugin-integration-plane-models';

const organizationRelations = [
	'employees',
	'employees.user',
	'employees.user.role',
	'employees.settings',
	'tenant'
];

export const getOrganizationQuery: Record<string, string> = {};

organizationRelations.forEach((relation, i) => {
	getOrganizationQuery[`relations[${i}]`] = relation;
});

/**
 * Transforms a role into a numeric role value based on predefined role hierarchy.
 *
 * @param {IRole} role - The role object containing the role name.
 * @returns {number} The corresponding role value. Returns 0 if the role is not recognized.
 */
export function roleTransformer(role: IRole): number {
	const rolePriority = {
		[RolesEnum.SUPER_ADMIN]: 20,
		[RolesEnum.ADMIN]: 20,
		[RolesEnum.MANAGER]: 20,
		[RolesEnum.EMPLOYEE]: 15,
		[RolesEnum.VIEWER]: 5
	};

	return rolePriority[role?.name] ?? 0;
}

/**
 * Maps a numeric role priority to its corresponding role name.
 *
 * @param {number} roleNumber - The numeric representation of a role's priority.
 * @returns {RolesEnum} The corresponding role name from the RolesEnum.
 *                      Defaults to RolesEnum.VIEWER if not matched.
 */
export function roleNameMap(roleNumber: number): RolesEnum {
	const roleMap = {
		20: RolesEnum.ADMIN,
		15: RolesEnum.EMPLOYEE,
		5: RolesEnum.VIEWER
	};

	return roleMap[roleNumber] ?? RolesEnum.VIEWER;
}

/**
 * Transforms an IOrganization object into a simplified workspace object.
 *
 * This is typically used to expose minimal workspace details in APIs or UI components.
 *
 * @param organization - The organization to transform.
 * @returns An object representing the workspace with id, name, and slug.
 */
export function workspaceTransformer(
	organization: IOrganization
): IWorkspaceInfo {
	return {
		id: organization.id,
		name: organization.name,
		slug: organization.id
	};
}

/**
 * Transforms an organization with its employees into a list of workspace user info objects.
 *
 * This includes view preferences, roles, and status of each member in the workspace.
 * It reads task view settings from each employee and formats them for frontend consumption.
 *
 * @param organization - The organization entity containing employee data.
 * @returns An array of workspace user info objects.
 */
export function organizationMembersTransformer(
	organization: IOrganization
): IWorkspaceUserInfo[] {
	const members = organization.employees ?? [];

	return members.map((member) => {
		const memberSetting =
			(member.settings ?? []).find(
				(s) =>
					s.settingType === EmployeeSettingTypeEnum.TASK_VIEWS &&
					s.entity === BaseEntityEnum.Tenant
			) ?? ({} as any);

		const { defaultData = {} } = memberSetting as Record<string, any>;

		const {
			filters: defaultFilters,
			display_filters: defaultDisplayFilters,
			display_properties: defaultDisplayProperties
		} = defaultData as Record<string, any>;

		const { issue_props } = memberSetting as Record<string, any>;

		return {
			id: member.userId,
			member: actorDetailsTransformer(member),
			workspace: workspaceTransformer(organization),
			created_at: member.createdAt,
			updated_at: member.updatedAt,
			deleted_at: member.deletedAt,
			role: roleTransformer(member.user!.role!),
			company_role: roleTransformer(member.user!.role!), // TODO: Know how it works
			view_props: memberSetting.data
				? {
						...employeeSettingSerializer(
							memberSetting as IEmployeeSetting
						)
					}
				: {},
			default_props: {
				filters: defaultFilters,
				display_filters: defaultDisplayFilters,
				display_properties: defaultDisplayProperties
			},
			issue_props,
			is_active: member.isActive
		};
	});
}

/**
 * Helper function to build query for the /employee/members endpoint.
 * Returns query params with organizationId and tenantId.
 */
export function getEmployeeMembersQuery(
	organizationId: string,
	tenantId: string
): Record<string, string> {
	return {
		organizationId,
		tenantId
	};
}

/**
 * Transforms an array of employees (from GET /employee/members) into workspace user info objects.
 *
 * This is the alternative to organizationMembersTransformer that works with the
 * /employee/members endpoint, which doesn't require ORG_EMPLOYEES_VIEW or ORG_USERS_VIEW
 * permissions (only ORG_MEMBERS_VIEW, available to EMPLOYEE role).
 *
 * Trade-offs vs organizationMembersTransformer:
 * - user.role is not available → defaults to MEMBER (15)
 * - employee.settings are not available → returns empty view_props/default_props
 *
 * @param employees - Array of employees from the /employee/members response.
 * @param organizationId - The organization ID for workspace info.
 * @param organizationName - Optional organization name for workspace info.
 * @returns An array of workspace user info objects.
 */
export function employeeMembersTransformer(
	employees: IEmployee[],
	organizationId: string,
	organizationName?: string
): IWorkspaceUserInfo[] {
	const members = employees ?? [];

	return members.map((member) => {
		return {
			id: member.userId,
			member: actorDetailsTransformer(member),
			workspace: {
				id: organizationId,
				name: organizationName || organizationId,
				slug: organizationId
			},
			created_at: member.createdAt,
			updated_at: member.updatedAt,
			deleted_at: member.deletedAt,
			role: member.user?.role
				? roleTransformer(member.user.role)
				: 15, // Default to MEMBER if role not available
			company_role: member.user?.role
				? roleTransformer(member.user.role)
				: 15,
			view_props: {},
			default_props: {},
			issue_props: undefined,
			is_active: member.isActive
		};
	});
}

/**
 * Categorizes a list of tasks by priority and calculates the count of tasks
 * for each priority level.
 *
 * @param {ITask[]} tasks - An array of tasks to be categorized by priority.
 * @returns {IUserPriorityDistribution[]} An array of priority distributions,
 * where each object contains the priority, the count of tasks with that priority,
 * and the priority's order.

 */
export function userIssuesByPriority(
	tasks: ITask[]
): IUserPriorityDistribution[] {
	// Mapping of priorities to their corresponding filters
	const priorityMapping = {
		urgent: TaskPriorityEnum.URGENT,
		high: TaskPriorityEnum.HIGH,
		medium: TaskPriorityEnum.MEDIUM,
		low: TaskPriorityEnum.LOW,
		none: null // Tasks without a priority
	};

	// Count tasks for each priority
	return Object.entries(priorityMapping).map(([priority, value], index) => ({
		priority,
		priority_count: tasks.filter(
			(task) =>
				task.priority === value || (value === null && !task.priority)
		).length,
		priority_order: index
	}));
}

/**
 * Transforms organization project data into a user-specific structure.
 * This function maps project details, tasks, and user profile information into a format
 * tailored for displaying user-related project data and statistics.
 *
 * @param {IOrganizationProject[]} projects - An array of organization projects to transform.
 * @param {ID} employeeId - The ID of the employee whose data is being processed.
 * @param {ID} userId - The ID of the user whose task information is needed.
 *
 * @returns {IUserProjectsDataResponse} The transformed user projects data, including project statistics and user profile information.
 *
 */
export function userWorkProjectsTransformer(
	projects: IOrganizationProject[],
	employeeId: ID,
	userId: ID
): IUserProjectsDataResponse {
	const employee = projects
		.map((project) => project.members)
		.flat()
		.find((member) => (member!.employeeId = employeeId))!.employee;

	const transformedProjects = projects.map((project) => {
		const createdIssues = project.tasks?.filter(
			(task) => task.createdByUserId === userId
		);

		const assignedIssues = project.tasks?.filter((task) =>
			task.members!.map((member) => member.id).includes(employeeId)
		);
		const {
			completedIssues,
			backlogIssues,
			startedIssues,
			unstartedIssues
		} = getTaskCounts(assignedIssues!);

		return {
			id: project.id,
			logo_props: {
				emoji: {
					url: project.imageUrl,
					value: project.icon
				},
				in_use: 'emoji'
			},
			created_issues: createdIssues?.length || 0,
			assigned_issues: assignedIssues?.length || 0,
			completed_issues: completedIssues || 0,
			pending_issues: backlogIssues + startedIssues + unstartedIssues || 0
		};
	}) as IUserProjectData[];

	const user_data: IUserProfileData = {
		email: employee!.user?.email!,
		first_name: employee!.user?.firstName,
		last_name: employee!.user?.lastName,
		avatar_url: employee!.user?.imageUrl,
		cover_image_url: undefined,
		date_joined: employee!.createdAt,
		user_timezone: 'UTC',
		display_name: employee!.fullName
	};

	return { project_data: transformedProjects, user_data };
}

/**
 * Transforms a workspace creation input into an organization creation input.
 *
 * This function extracts member IDs from the provided input and ensures
 * at least one employee ID is included (defaulting to the current employee if none are given).
 *
 * @param {ICreateWorkSpace} input - The input object representing a workspace creation request.
 * @returns {IOrganizationCreateInput} - The transformed input suitable for organization creation.
 */
export function createOrganizationInputTransformer(
	input: ICreateWorkSpace
): IOrganizationCreateInput {
	let memberIds: { employeeId: ID }[] = [];

	if (input.members) {
		memberIds = extractMemberIds(input.members);
	}

	return {
		name: input.name!,
		employees:
			(memberIds.length > 0
				? [...memberIds, currentEmployeeId()]
				: [currentEmployeeId()]) as IEmployee[],
		currency: CurrenciesEnum.USD
	};
}
