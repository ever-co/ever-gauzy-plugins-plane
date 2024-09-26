import {
	ICreateModuleInput,
	ID,
	IModule,
	IOrganizationProjectModule,
	IOrganizationProjectModuleCreateInput,
	ITask,
	TaskStatusEnum,
} from '@plane-plugin/models';
import { defaultOrganizationId, defaultTestTenantId } from '../../credentials';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { mapGroupToTemplate } from '../tasks';

function getTaskCounts(tasks: ITask[]) {
	const completedIssues = tasks?.filter(
		(task) =>
			task.status === TaskStatusEnum.DONE ||
			task.status === TaskStatusEnum.COMPLETED,
	).length;

	const startedIssues = tasks?.filter(
		(task) =>
			task.status === TaskStatusEnum.IN_PROGRESS ||
			task.status === TaskStatusEnum.READY_FOR_REVIEW ||
			task.status === TaskStatusEnum.IN_REVIEW ||
			task.status === TaskStatusEnum.BLOCKED,
	).length;

	const unstartedIssues = tasks?.filter(
		(task) => task.status === TaskStatusEnum.OPEN,
	).length;

	const backlogIssues = tasks?.filter(
		(task) => task.status === TaskStatusEnum.BACKLOG,
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
	managerId?: ID,
): IModule[] | IModule {
	const transformModule = (projectModule: IOrganizationProjectModule) => {
		const {
			completedIssues,
			startedIssues,
			unstartedIssues,
			backlogIssues,
		} = getTaskCounts(projectModule?.tasks);

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
			is_favorite: projectModule.isFavorite,
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
			completion_chart: {},
		},
	};
}

export function createModuleInputTransformer(
	module: ICreateModuleInput,
	managerId?: ID,
): IOrganizationProjectModuleCreateInput {
	return {
		name: module.name,
		description: module.description,
		manager: { id: managerId },
		managerId,
		status: mapGroupToTemplate(module.status),
		startDate: module.start_date,
		endDate: module.target_date,
		members: module.member_ids.map((id) => ({ id })),
		projectId: module.project_id,
		tenantId: defaultTestTenantId,
		organizationId: defaultOrganizationId,
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

export const getModulesQuery = (projectId?: ID): Record<string, string> => {
	// Base queries
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery,
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
