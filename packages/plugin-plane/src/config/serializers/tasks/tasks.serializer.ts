import {
	ICompletedIssuesDistribution,
	ID,
	IEmployee,
	IIssue,
	IIssueCreateInput,
	IIssueFindInput,
	IIssueUpdateInput,
	IOrganizationProjectModule,
	ITag,
	ITask,
	ITaskCreateInput,
	ITaskUpdateInput,
	TaskPriorityEnum,
	TaskStatusEnum,
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { stateGroup } from './statuses';
import { defaultOrganizationId, defaultTestTenantId } from '../../credentials';

export function issueAssigneesIds(issue: ITask): ID[] {
	const assignees = issue?.members;

	return assignees?.map((member) => member.id);
}

export function issueLabelsIds(issue: ITask): ID[] {
	const labels = issue?.tags;

	return labels?.map((member) => member.id);
}

export function issueTransformer(issue: ITask): IIssue {
	return {
		id: issue.id,
		name: issue.title,
		state_id: issue.taskStatusId,
		sort_order: 65535.0, // TODO : Research usecase and add to API
		completed_at: issue.resolvedAt,
		estimate_point: null, // TODO : Research usecase and add to API
		priority: issue.priority?.toLocaleLowerCase() as TaskPriorityEnum,
		start_date: issue.startDate,
		target_date: issue.dueDate,
		sequence_id: issue.number,
		project_id: issue.projectId,
		parent_id: issue.parentId,
		parent: {
			id: issue?.parent?.id,
			project_id: issue?.parent?.projectId,
			type_id: 'ba32a722-eefd-4a6a-b80f-85eb5d811c22',
			sequence_id: issue.parent?.number,
		},
		created_at: issue.createdAt,
		updated_at: issue.updatedAt,
		created_by: issue.creatorId,
		updated_by: issue.creatorId,
		is_draft: issue.isDraft,
		archived_at: issue.archivedAt,
		state__group: stateGroup(issue.taskStatus),
		type_id: 'ba32a722-eefd-4a6a-b80f-85eb5d811c22', // TODO : Add to APIs this type as entity
		description_html: issue.description ?? '<p></p>',
		cycle_id: issue.organizationSprintId,
		link_count: 0, // TODO: Add to API
		attachment_count: 0, // TODO : Add to API,
		sub_issues_count: issue.children?.length,
		assignee_ids: issueAssigneesIds(issue),
		label_ids: issueLabelsIds(issue),
		module_ids: issue.modules?.map(({ id }) => id),
	};
}

export function parentableIssuesTransformer(issues: ITask[]) {
	return issues.map((issue) => ({
		id: issue.id,
		name: issue.title,
		start_date: issue.startDate,
		sequence_id: issue.number,
		project__name: issue.project.name,
		project__identifier:
			issue.project.code ||
			issue.project.name.slice(0, 4).toLocaleUpperCase(),
		project_id: issue.projectId,
		workspace__slug: 'cardano', // TODO : Make this as dynamic as possible
		state__name: issue.taskStatus?.name,
		state__group: stateGroup(issue.taskStatus),
		state__color: issue.taskStatus?.color,
		type_id: 'ba32a722-eefd-4a6a-b80f-85eb5d811c22',
	}));
}

export function getProjectTasksTransformer() {
	return;
}

export function groupIssuesByStateId(issues: ITask[]) {
	return issues.reduce(
		(acc, item) => {
			const stateId = item.taskStatusId;

			if (!acc.results[stateId]) {
				acc.results[stateId] = {
					results: [],
					total_results: 0,
				};
			}
			const issue = issueTransformer(item);

			acc.results[stateId].results.push(issue);
			acc.results[stateId].total_results++;

			acc.total_results++;
			return acc;
		},
		{
			grouped_by: 'state_id',
			sub_grouped_by: null,
			total_count: issues.length,
			next_cursor: '30:1:0',
			prev_cursor: '30:-1:1',
			next_page_results: false,
			prev_page_results: false,
			count: issues.length,
			total_pages: 1,
			total_results: issues.length,
			extra_stats: null,
			results: {},
		},
	);
}

export const taskRelations = [
	'tags',
	'teams',
	'members',
	'members.user',
	'creator',
	'project',
	'linkedIssues',
	'linkedIssues.taskTo',
	'linkedIssues.taskFrom',
	'parent',
	'children',
	'children.taskStatus',
	'taskStatus',
	'modules',
];

export const getTaskQuery = (
	projectId?: ID,
	options?: IIssueFindInput,
): Record<string, any> => {
	// Base queries
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery,

		// 'join[alias]': 'task',
		// 'join[leftJoinAndSelect][members]': 'task.members',
		// 'join[leftJoinAndSelect][user]': 'members.user',
	};

	if (projectId) {
		query['where[projectId]'] = projectId;
	}

	if (options?.module) {
		query['join[alias]'] = 'task';
		// query['where[modules][0]'] = options.module;
	}

	// Add relations
	taskRelations.forEach((relation, i) => {
		query[`relations[${i}]`] = relation;
	});

	return query;
};

export function createIssueInputTransformer(
	issue: IIssueCreateInput,
	status: TaskStatusEnum,
): ITaskCreateInput {
	const tags = issue.label_ids
		? issue.label_ids.map((id) => ({ id }) as ITag)
		: [];
	const members = issue.assignee_ids
		? issue.assignee_ids.map((id) => ({ id }) as IEmployee)
		: [];
	return {
		title: issue.name,
		description: issue.description_html,
		priority: issue.priority,
		startDate: issue.start_date,
		dueDate: issue.target_date,
		projectId: issue.project_id,
		status,
		tags,
		members,
		organizationSprintId: issue.cycle_id,
		parentId: issue.parent_id,
		taskStatusId: issue.state_id,
		tenantId: defaultTestTenantId,
		organizationId: defaultOrganizationId,
		modules:
			issue.module_ids?.map(
				(id) => ({ id }) as IOrganizationProjectModule,
			) || [],
	};
}

export function updateIssueInputTransformer(
	issue: IIssueUpdateInput,
	status: TaskStatusEnum,
	modules?: ID[],
): Partial<ITaskUpdateInput> {
	// Mapping between IIssueUpdateInput and ITaskUpdateInput
	const keyMapping: Partial<
		Record<keyof IIssueUpdateInput, keyof ITaskUpdateInput>
	> = {
		name: 'title',
		description_html: 'description',
		priority: 'priority',
		start_date: 'startDate',
		target_date: 'dueDate',
		project_id: 'projectId',
		cycle_id: 'organizationSprintId',
		parent_id: 'parentId',
		state_id: 'taskStatusId',
		module_ids: 'modules',
	};

	// Include only user provided flelds in the final request
	const transformedInput: ITaskUpdateInput = Object.entries(
		keyMapping,
	).reduce(
		(
			acc: Partial<Omit<ITaskUpdateInput, 'parent'>>,
			[issueKey, taskKey],
		) => {
			if (issueKey in issue) {
				const value = issue[issueKey as keyof IIssueUpdateInput];
				acc[taskKey] = value;
			}

			if ('state_id' in issue) {
				acc['status'] = status;

				acc['resolvedAt'] =
					status.toLowerCase() === TaskStatusEnum.COMPLETED ||
					status.toLowerCase() === TaskStatusEnum.DONE
						? new Date()
						: null;
			}
			acc['organizationId'] = defaultOrganizationId;

			if (issue.module_ids || issue.modules) {
				acc['modules'] = modules.map((module) => ({ id: module }));
			}

			return acc;
		},
		{} as ITaskUpdateInput,
	);

	// Add tags only if label_ids is defined
	if (issue.label_ids) {
		transformedInput.tags = issue.label_ids.map((id) => ({ id }) as ITag);
	}

	// Add members only if assignee_ids is defined
	if (issue.assignee_ids) {
		transformedInput.members = issue.assignee_ids.map(
			(id) => ({ id }) as IEmployee,
		);
	}

	return transformedInput;
}

export function getTaskDistribution(tasks: ITask[]) {
	const stateDistribution: ICompletedIssuesDistribution = {
		completed: [],
		started: [],
		unstarted: [],
		backlog: [],
	};

	const statusMap: { [key: string]: keyof typeof stateDistribution } = {
		[TaskStatusEnum.DONE.toLocaleLowerCase()]: 'completed',
		[TaskStatusEnum.COMPLETED.toLocaleLowerCase()]: 'completed',
		[TaskStatusEnum.IN_PROGRESS.toLocaleLowerCase()]: 'started',
		[TaskStatusEnum.READY_FOR_REVIEW.toLocaleLowerCase()]: 'started',
		[TaskStatusEnum.IN_REVIEW.toLocaleLowerCase()]: 'started',
		[TaskStatusEnum.BLOCKED.toLocaleLowerCase()]: 'started',
		[TaskStatusEnum.OPEN.toLocaleLowerCase()]: 'unstarted',
		[TaskStatusEnum.BACKLOG.toLocaleLowerCase()]: 'backlog',
	};

	tasks.forEach((task) => {
		const status = task.status.toLocaleLowerCase();
		const category = statusMap[status];

		if (category) {
			stateDistribution[category].push(task.id);
		}

		if (task.taskStatus.isTodo) {
			stateDistribution['unstarted'].push(task.id);
		}

		if (task.taskStatus.isInProgress) {
			stateDistribution['started'].push(task.id);
		}

		if (task.taskStatus.isDone) {
			stateDistribution['completed'].push(task.id);
		}
	});

	return stateDistribution;
}
