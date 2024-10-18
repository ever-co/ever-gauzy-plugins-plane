import {
	CompletionDateType,
	ICompletionChart,
	ICreateModuleInput,
	ID,
	IModule,
	IOrganizationProjectModule,
	IOrganizationProjectModuleCreateInput,
	ITask,
	ProjectModuleStatusEnum,
	TaskStatusEnum,
} from '@plane-plugin/models';
import { defaultOrganizationId, defaultTestTenantId } from '../../credentials';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

export function getTaskCounts(tasks: ITask[]) {
	const completedIssues = tasks?.filter(
		(task) =>
			task.status.toLocaleLowerCase() ===
				TaskStatusEnum.DONE.toLocaleLowerCase() ||
			task.status.toLocaleLowerCase() ===
				TaskStatusEnum.COMPLETED.toLocaleLowerCase(),
	).length;

	const startedIssues = tasks?.filter(
		(task) =>
			task.status.toLocaleLowerCase() ===
				TaskStatusEnum.IN_PROGRESS.toLocaleLowerCase() ||
			task.status.toLocaleLowerCase() ===
				TaskStatusEnum.READY_FOR_REVIEW.toLocaleLowerCase() ||
			task.status.toLocaleLowerCase() ===
				TaskStatusEnum.IN_REVIEW.toLocaleLowerCase() ||
			task.status.toLocaleLowerCase() ===
				TaskStatusEnum.BLOCKED.toLocaleLowerCase(),
	).length;

	const unstartedIssues = tasks?.filter(
		(task) =>
			task.status.toLocaleLowerCase() ===
			TaskStatusEnum.OPEN.toLocaleLowerCase(),
	).length;

	const backlogIssues = tasks?.filter(
		(task) =>
			task.status.toLocaleLowerCase() ===
			TaskStatusEnum.BACKLOG.toLocaleLowerCase(),
	).length;

	return {
		completedIssues,
		startedIssues,
		unstartedIssues,
		backlogIssues,
	};
}

export function modulesTransformer(
	modules: IOrganizationProjectModule[] | IOrganizationProjectModule,
	favoriteIds?: ID[],
	managerId?: ID,
): IModule[] | IModule {
	const transformModule = (projectModule: IOrganizationProjectModule) => {
		const {
			completedIssues,
			startedIssues,
			unstartedIssues,
			backlogIssues,
		} = getTaskCounts(projectModule?.tasks);

		const isFavorite = favoriteIds?.includes(projectModule.id);

		return {
			id: projectModule.id,
			name: projectModule.name,
			status: projectModule.status,
			description: projectModule.description,
			description_html: projectModule.description,
			description_text: projectModule.description,
			start_date: projectModule.startDate,
			target_date: projectModule.endDate,
			project_id: projectModule.projectId,
			lead_id: managerId ?? projectModule.managerId,
			view_props: {},
			sort_order: 0,
			external_id: null,
			external_source: null,
			logo_props: {},
			created_at: projectModule.createdAt,
			updated_at: projectModule.updatedAt,
			is_favorite: isFavorite,
			completed_issues: completedIssues,
			started_issues: startedIssues,
			unstarted_issues: unstartedIssues,
			backlog_issues: backlogIssues,
			cancelled_issues: 0,
			total_issues: projectModule.tasks?.length,
			completed_estimate_points: 0,
			total_estimate_points: 0,
			member_ids: projectModule.members.map((member) => member.id),
			workspace_id: projectModule.tenantId,
			...moduleDetailsAdapter(projectModule),
		};
	};

	if (Array.isArray(modules)) {
		return modules.map(transformModule);
	}

	return transformModule(modules);
}

export function moduleDetailsAdapter(module: IOrganizationProjectModule) {
	// Module members
	const assignees = module.members.map((member) => {
		const user = member.user;
		return {
			first_name: user.firstName,
			last_name: user.lastName,
			assignee_id: member.id,
			display_name: member.fullName,
			avatar: user.imageUrl,
			total_estimates: 0,
			completed_estimates: 0,
			pending_estimates: 0,
		};
	});

	return {
		estimate_distribution: {
			assignees,
			labels: [],
			completion_chart: {},
		},
		distribution: {
			assignees,
			labels: [],
			completion_chart: completionChartMapping(module),
		},
	};
}

export function createModuleInputTransformer(
	module: ICreateModuleInput | Partial<ICreateModuleInput>,
	managerId?: ID,
): IOrganizationProjectModuleCreateInput {
	return {
		name: module.name,
		description: module.description,
		managerId,
		status: module.status as ProjectModuleStatusEnum,
		startDate: module.start_date,
		endDate: module.target_date,
		members: (module.member_ids ?? []).map((id) => ({ id })),
		projectId: module.project_id,
		tenantId: defaultTestTenantId(),
		organizationId: defaultOrganizationId(),
	};
}

export const moduleRelations = [
	'parent',
	'project',
	'creator',
	'manager',
	'members',
	'members.user',
	'children',
	'tasks',
];

export const getModulesQuery = (projectId?: ID): Record<string, any> => {
	// Base queries
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery(),
	};

	if (projectId) {
		query['where[projectId]'] = projectId;
	}

	// Add relations
	moduleRelations.forEach((relation, i) => {
		query[`relations[${i}]`] = relation;
	});

	return query;
};
/**
 * @description Generate an object completion_chart with dates between start_date and target_date.
 * @param {IOrganizationProjectModule} module A project module for build chart
 * @returns An object { "YYYY-MM-DD": 0 | null } representing the completion_chart
 */
export function completionChartMapping(module: IOrganizationProjectModule) {
	// Format startDate and targetDate to YYYY-MM-DD
	const startDate: CompletionDateType = module.startDate
		?.toString()
		.split('T')[0];
	const targetDate: CompletionDateType = module.endDate
		?.toString()
		.split('T')[0];

	const chart: ICompletionChart = {};

	// Check if both startDate and endDate exist
	if (!startDate || !targetDate) return chart;

	// Initialize date range between startDate and targetDate
	const start = new Date(startDate);
	const end = new Date(targetDate);
	const currentDate = new Date(start);

	// Iterate all dates between start and end, and add each date to chart object
	while (currentDate <= end) {
		const formattedDate = currentDate.toISOString().split('T')[0]; // Format YYYY-MM-DD
		chart[formattedDate] = 0; // Initialize each date with 0
		currentDate.setDate(currentDate.getDate() + 1); // Move to next date
	}

	// Safely iterate over tasks if they exist and are an array
	(module.tasks ?? []).forEach((task) => {
		const completedAt: CompletionDateType = task.resolvedAt
			?.toString()
			.split('T')[0];
		if (completedAt && chart.hasOwnProperty(completedAt)) {
			chart[completedAt]! += 1; // Increment the value for the corresponding date
		}
	});

	return chart;
}
