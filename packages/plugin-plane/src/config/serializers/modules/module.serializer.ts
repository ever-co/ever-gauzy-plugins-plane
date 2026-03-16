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
	TaskStatusEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import { currentTenantId, getCurrentOrganizationSlug } from '../../credentials';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { deslugify } from '../../utils';

export function getTaskCounts(tasks: ITask[]) {
	const completedIssues = tasks?.filter(
		(task) =>
			task?.status?.toLocaleLowerCase() ===
				TaskStatusEnum.DONE.toLocaleLowerCase() ||
			task?.status?.toLocaleLowerCase() ===
				TaskStatusEnum.COMPLETED.toLocaleLowerCase()
	).length;

	const startedIssues = tasks?.filter(
		(task) =>
			task?.status ===
				deslugify(TaskStatusEnum.IN_PROGRESS.toLocaleLowerCase()) ||
			task?.status ===
				deslugify(
					TaskStatusEnum.READY_FOR_REVIEW.toLocaleLowerCase()
				) ||
			task?.status ===
				deslugify(TaskStatusEnum.IN_REVIEW.toLocaleLowerCase()) ||
			task?.status === TaskStatusEnum.BLOCKED.toLocaleLowerCase()
	).length;

	const unstartedIssues = tasks?.filter(
		(task) =>
			task?.status?.toLocaleLowerCase() ===
			TaskStatusEnum.OPEN.toLocaleLowerCase()
	).length;

	const backlogIssues = tasks?.filter(
		(task) =>
			task?.status?.toLocaleLowerCase() ===
			TaskStatusEnum.BACKLOG.toLocaleLowerCase()
	).length;

	return {
		completedIssues,
		startedIssues,
		unstartedIssues,
		backlogIssues
	};
}

export function modulesTransformer(
	modules: IOrganizationProjectModule[] | IOrganizationProjectModule,
	favoriteIds?: ID[]
): IModule[] | IModule {
	const transformModule = (projectModule: IOrganizationProjectModule) => {
		const {
			completedIssues,
			startedIssues,
			unstartedIssues,
			backlogIssues
		} = getTaskCounts(projectModule?.tasks);

		const isFavorite = favoriteIds?.includes(projectModule?.id);
		const leadId = projectModule?.members?.filter(
			(member) => member.isManager && member.roleId
		)[0]?.employeeId;

		return {
			id: projectModule?.id,
			name: projectModule?.name,
			status: projectModule?.status,
			description: projectModule?.description,
			description_html: projectModule?.description,
			description_text: projectModule?.description,
			start_date: projectModule?.startDate,
			target_date: projectModule?.endDate,
			project_id: projectModule?.projectId,
			lead_id: leadId,
			view_props: {},
			sort_order: 0,
			external_id: null,
			external_source: null,
			logo_props: {},
			created_at: projectModule?.createdAt,
			updated_at: projectModule?.updatedAt,
			is_favorite: isFavorite,
			completed_issues: completedIssues,
			started_issues: startedIssues,
			unstarted_issues: unstartedIssues,
			backlog_issues: backlogIssues,
			cancelled_issues: 0,
			total_issues: projectModule?.tasks?.length,
			completed_estimate_points: 0,
			total_estimate_points: 0,
			member_ids: projectModule?.members?.map(
				(member) => member.employeeId
			),
			workspace_id: projectModule?.organizationId,
			...(projectModule ? moduleDetailsAdapter(projectModule) : {})
		};
	};

	if (Array.isArray(modules)) {
		return modules.map(transformModule);
	}

	return transformModule(modules);
}

export function moduleDetailsAdapter(module: IOrganizationProjectModule) {
	const tasks = module?.tasks;

	const labelMap = new Map<string, any>();

	tasks?.forEach((task) => {
		task.tags.forEach((label) => {
			if (!labelMap.has(label.id)) {
				labelMap.set(label.id, {
					label_name: label.name,
					color: label.color,
					label_id: label.id,
					total_issues: 0,
					completed_issues: 0,
					pending_issues: 0
				});
			}

			const labelData = labelMap.get(label.id);
			labelData.total_issues += 1;

			if (
				task.status.toLocaleLowerCase() === 'completed' ||
				task.status.toLocaleLowerCase() === 'done'
			) {
				labelData.completed_issues += 1;
			} else {
				labelData.pending_issues += 1;
			}
		});
	});

	const labels = Array.from(labelMap.values());

	// Module members
	const assignees = module?.members?.map((member) => {
		const user = member?.employee?.user;

		let totalIssues = 0;
		let completedIssues = 0;
		let pendingIssues = 0;

		(tasks ?? []).forEach((task) => {
			if (task.members.some((assignee) => assignee.id === member.id)) {
				// Increment the total issues number
				totalIssues++;

				// Check if the task is completed or still pending
				if (
					task.status.toLocaleLowerCase() === 'completed' ||
					task.status.toLocaleLowerCase() === 'done'
				) {
					completedIssues++;
				} else {
					pendingIssues++;
				}
			}
		});

		return {
			first_name: user?.firstName,
			last_name: user?.lastName,
			assignee_id: member?.id,
			display_name: member?.employee?.fullName,
			avatar: user?.imageUrl,
			total_issues: totalIssues,
			completed_issues: completedIssues,
			pending_issues: pendingIssues
		};
	});

	return {
		estimate_distribution: {
			assignees,
			labels: [],
			completion_chart: {}
		},
		distribution: {
			assignees,
			labels,
			completion_chart: {
				...(module ? completionChartMapping(module) : {})
			}
		}
	};
}

export function createModuleInputTransformer(
	module: ICreateModuleInput | Partial<ICreateModuleInput>,
	managerId?: ID
): IOrganizationProjectModuleCreateInput {
	return {
		name: module.name,
		description: module.description,
		status: module.status as ProjectModuleStatusEnum,
		startDate: module.start_date,
		endDate: module.target_date,
		memberIds: (module.member_ids ?? []).map((id) => id),
		managerIds: managerId ? [managerId] : [],
		projectId: module.project_id,
		tasks: (module.issues ?? []).map((id) => ({ id })),
		tenantId: currentTenantId(),
		organizationId: getCurrentOrganizationSlug()
	};
}

export const moduleRelations = [
	'parent',
	'project',
	'creator',
	'members.employee.user',
	'children',
	'tasks',
	'tasks.tags',
	'tasks.members.user'
];

export const getModulesQuery = (
	projectId?: ID,
	relations?: string[]
): Record<string, any> => {
	// Base queries
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	if (projectId) {
		query['where[projectId]'] = projectId;
	}

	// Add relations
	if (relations) {
		relations.forEach((relation, i) => {
			query[`relations[${i}]`] = relation;
		});
	} else {
		moduleRelations.forEach((relation, i) => {
			query[`relations[${i}]`] = relation;
		});
	}

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
