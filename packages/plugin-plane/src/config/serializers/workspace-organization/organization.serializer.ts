import { employeeSettingSerializer } from '../employee-properties';
import { getTaskCounts } from '../modules';
import { actorDetailsTransformer } from '../user';
import { IOrganizationProject } from './../../../../../models/src/imports/organization-projects.model';
import {
	IRole,
	ITask,
	IWorkspaceUserInfo,
	RolesEnum,
	TaskPriorityEnum,
	IUserPriorityDistribution,
	IUserProjectData,
	ID,
	IUserProjectsDataResponse,
	IUserProfileData,
	EmployeeSettingTypeEnum,
	BaseEntityEnum,
	IEmployeeSetting,
	IOrganization
} from '@plane-plugin/models';

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
			workspace: {
				id: organization.id,
				name: organization.name,
				slug: organization.id
			},
			created_at: member.createdAt,
			updated_at: member.updatedAt,
			deleted_at: member.deletedAt,
			role: roleTransformer(member.user.role),
			company_role: '', // TODO: Know how it works
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
		.find((member) => (member.employeeId = employeeId)).employee;

	const transformedProjects: IUserProjectData[] = projects.map((project) => {
		const createdIssues = project.tasks?.filter(
			(task) => task.creatorId === userId
		);

		const assignedIssues = project.tasks?.filter((task) =>
			task.members.map((member) => member.id).includes(employeeId)
		);
		const {
			completedIssues,
			backlogIssues,
			startedIssues,
			unstartedIssues
		} = getTaskCounts(assignedIssues);

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
	});

	const user_data: IUserProfileData = {
		email: employee.user.email,
		first_name: employee.user.firstName,
		last_name: employee.user.lastName,
		avatar_url: employee.user.imageUrl,
		cover_image_url: null,
		date_joined: employee.createdAt,
		user_timezone: 'UTC',
		display_name: employee.fullName
	};

	return { project_data: transformedProjects, user_data };
}
