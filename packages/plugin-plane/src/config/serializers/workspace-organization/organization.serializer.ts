import { getTaskCounts } from '../modules';
import { IOrganizationProject } from './../../../../../models/src/imports/organization-projects.model';
import {
	IEmployee,
	IRole,
	ITask,
	ITenant,
	IWorkspaceUserInfo,
	RolesEnum,
	TaskPriorityEnum,
	IUserPriorityDistribution,
	IUserProjectData,
	ID,
	IUserProjectsDataResponse,
	IUserProfileData,
} from '@plane-plugin/models';

const organizationRelations = [
	'employees',
	'employees.user',
	'employees.user.role',
	'tenant',
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
		[RolesEnum.VIEWER]: 5,
	};

	return rolePriority[role.name] ?? 0;
}

export function organizationMembersTransformer(
	members: IEmployee[],
	tenant: ITenant,
): IWorkspaceUserInfo[] {
	return members.map((member) => {
		return {
			id: member.userId,
			member: {
				id: member.id,
				first_name: member.user.firstName,
				last_name: member.user.lastName,
				avatar: member.user.imageUrl,
				is_bot: false,
				email: member.user.email,
				display_name:
					member.fullName ||
					`${member.user.firstName} ${member.user.lastName}`,
			},
			workspace: {
				id: tenant.id,
				name: tenant.name,
				slug: tenant.name.toLowerCase(),
			},
			created_at: member.createdAt,
			updated_at: member.updatedAt,
			deleted_at: member.deletedAt,
			role: roleTransformer(member.user.role),
			company_role: '', // TODO: Know how it works
			view_props: {
				filters: {
					state: null,
					labels: null,
					priority: null,
					assignees: null,
					created_by: null,
					start_date: null,
					subscriber: null,
					state_group: null,
					target_date: null,
				},
				display_filters: {
					type: null,
					layout: 'list',
					group_by: null,
					order_by: '-created_at',
					sub_issue: true,
					show_empty_groups: true,
					calendar_date_range: '',
				},
				display_properties: {
					key: true,
					link: true,
					state: true,
					labels: true,
					assignee: true,
					due_date: true,
					estimate: true,
					priority: true,
					created_on: true,
					start_date: true,
					updated_on: true,
					sub_issue_count: true,
					attachment_count: true,
				},
			},
			default_props: {
				filters: {
					state: null,
					labels: null,
					priority: null,
					assignees: null,
					created_by: null,
					start_date: null,
					subscriber: null,
					state_group: null,
					target_date: null,
				},
				display_filters: {
					type: null,
					layout: 'list',
					group_by: null,
					order_by: '-created_at',
					sub_issue: true,
					show_empty_groups: true,
					calendar_date_range: '',
				},
				display_properties: {
					key: true,
					link: true,
					state: true,
					labels: true,
					assignee: true,
					due_date: true,
					estimate: true,
					priority: true,
					created_on: true,
					start_date: true,
					updated_on: true,
					sub_issue_count: true,
					attachment_count: true,
				},
			},
			issue_props: {
				created: true,
				assigned: true,
				all_issues: true,
				subscribed: true,
			},
			is_active: member.isActive,
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
	tasks: ITask[],
): IUserPriorityDistribution[] {
	// Mapping of priorities to their corresponding filters
	const priorityMapping = {
		urgent: TaskPriorityEnum.URGENT,
		high: TaskPriorityEnum.HIGH,
		medium: TaskPriorityEnum.MEDIUM,
		low: TaskPriorityEnum.LOW,
		none: null, // Tasks without a priority
	};

	// Count tasks for each priority
	return Object.entries(priorityMapping).map(([priority, value], index) => ({
		priority,
		priority_count: tasks.filter(
			(task) =>
				task.priority === value || (value === null && !task.priority),
		).length,
		priority_order: index,
	}));
}

export function userWorkProjectsTransformer(
	projects: IOrganizationProject[],
	employeeId: ID,
	userId: ID,
): IUserProjectsDataResponse {
	const employee = projects
		.map((project) => project.members)
		.flat()
		.find((member) => (member.employeeId = employeeId)).employee;

	const transformedProjects: IUserProjectData[] = projects.map((project) => {
		const createdIssues = project.tasks?.filter(
			(task) => task.creatorId === userId,
		);

		const assignedIssues = project.tasks?.filter((task) =>
			task.members.map((member) => member.id).includes(employeeId),
		);
		const {
			completedIssues,
			backlogIssues,
			startedIssues,
			unstartedIssues,
		} = getTaskCounts(assignedIssues);

		return {
			id: project.id,
			logo_props: {
				emoji: {
					url: project.imageUrl,
					value: project.icon,
				},
				in_use: 'emoji',
			},
			created_issues: createdIssues?.length || 0,
			assigned_issues: assignedIssues?.length || 0,
			completed_issues: completedIssues || 0,
			pending_issues:
				backlogIssues + startedIssues + unstartedIssues || 0,
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
		display_name: employee.fullName,
	};

	return { project_data: transformedProjects, user_data };
}
