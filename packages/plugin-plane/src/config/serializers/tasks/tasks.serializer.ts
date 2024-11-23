import {
	ICompletedIssuesDistribution,
	ID,
	IEmployee,
	IIssue,
	IIssueCreateInput,
	IIssueFindInput,
	IIssueLabel,
	IIssueLink,
	IIssueUpdateInput,
	IOrganizationProjectModule,
	IReactionData,
	ITag,
	ITask,
	ITaskCreateInput,
	ITaskDateFilterInput,
	ITaskUpdateInput,
	TaskPriorityEnum,
	TaskStatusEnum,
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { stateGroup } from './statuses';
import { defaultOrganizationId, defaultTestTenantId } from '../../credentials';
import { issueRelationTransformer } from './issue-relations';

export function issueAssigneesIds(issue: ITask): ID[] {
	const assignees = issue?.members;

	return assignees?.map((member) => member.id);
}

export function issueLabelsIds(issue: ITask): ID[] {
	const labels = issue?.tags;

	return labels?.map((member) => member.id);
}

export function issueTransformer(
	issue: ITask,
	reactions?: IReactionData[],
	links?: IIssueLink[],
): IIssue {
	return {
		id: issue.id,
		name: issue.title,
		state: issue.status,
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
		link_count: links?.length || 0,
		attachment_count: 0, // TODO : Add to API,
		sub_issues_count: issue.children?.length,
		assignee_ids: issueAssigneesIds(issue),
		label_ids: issueLabelsIds(issue),
		module_ids: issue.modules?.map(({ id }) => id),
		issue_reactions: reactions || [],
		issue_relation: issueRelationTransformer(issue.linkedIssues) || [],
		issue_link: links || [],
		cycle: issue.organizationSprint,
	};
}

export function parentableIssuesTransformer(issues: ITask[]) {
	return issues.map((issue) => ({
		id: issue.id,
		name: issue.title,
		start_date: issue.startDate,
		targe_date: issue.dueDate,
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

/**
 * @description - Group issues by state ID for Kanban and list Layouts
 * @param {ITask[]} issues - Tasks to be trasnformed and grouped
 * @returns Tranformed and grouped by state Issues
 */
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

/**
 * Groups issues by their state group and associates their links.
 *
 * @param {Array<{ issue: ITask; issueLinks: any }>} issuesWithLinks - Array of issues and their associated links.
 * @returns A structured object grouping issues by state group, with counts and metadata.
 */
export function groupIssuesByStateGroup(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
) {
	return issuesWithLinks.reduce(
		(acc, { issue, issueLinks }) => {
			// Determine the group for the current issue based on its task status
			const statusGroup = stateGroup(issue.taskStatus);

			// Initialize the group if it doesn't exist yet
			if (!acc.results[statusGroup]) {
				acc.results[statusGroup] = {
					results: [],
					total_results: 0,
				};
			}

			// Transform the issue using the provided transformer, passing the issue and its links
			const transformedIssue = issueTransformer(issue, [], issueLinks);

			// Add the transformed issue to the corresponding group
			acc.results[statusGroup].results.push(transformedIssue);
			acc.results[statusGroup].total_results++;

			// Increment the total results counter
			acc.total_results++;
			acc.total_count++;
			acc.count++;
			return acc;
		},
		// Initial accumulator object
		{
			grouped_by: 'state__group',
			sub_grouped_by: null,
			total_count: 5,
			next_cursor: '30:1:0',
			prev_cursor: '30:-1:1',
			next_page_results: false,
			prev_page_results: false,
			count: 0,
			total_pages: 1,
			total_results: 0,
			extra_stats: null,
			results: {},
		},
	);
}

export function groupIssuesByPriorityGroup(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
) {
	return issuesWithLinks.reduce(
		(acc, { issue, issueLinks }) => {
			// Determine the priority group; use "none" if priority is null or undefined
			const priorityGroup = issue.priority || 'none';

			// Initialize the priority group if it doesn't exist
			if (!acc.results[priorityGroup]) {
				acc.results[priorityGroup] = {
					results: [],
					total_results: 0,
				};
			}

			// Transform the issue and its links
			const transformedIssue = issueTransformer(issue, [], issueLinks);

			// Add the transformed issue to the corresponding priority group
			acc.results[priorityGroup].results.push(transformedIssue);
			acc.results[priorityGroup].total_results++;

			// Increment the total results counter
			acc.total_results++;
			acc.total_count++;
			acc.count++;
			return acc;
		},
		// Initial accumulator object
		{
			grouped_by: 'priority',
			sub_grouped_by: null,
			total_count: 0,
			next_cursor: null,
			prev_cursor: null,
			next_page_results: false,
			prev_page_results: false,
			count: 0,
			total_pages: 1,
			total_results: 0,
			extra_stats: null,
			results: {},
		},
	);
}

/**
 * @description - Group Issue by Target Date for Calendar Layout display
 * @param {ITask[]} issues - Tasks to be trasnformed and grouped
 * @returns Tranformed and grouped by target date Issues
 */
export function groupIssuesByTargetDate(issues: ITask[]) {
	return issues.reduce(
		(acc, item) => {
			const targetDate = item.dueDate?.toString().split('T')[0];

			if (!acc.results[targetDate]) {
				acc.results[targetDate] = {
					results: [],
					total_results: 0,
				};
			}
			const issue = issueTransformer(item);

			acc.results[targetDate].results.push(issue);
			acc.results[targetDate].total_results++;

			acc.total_results++;
			return acc;
		},
		{
			grouped_by: 'target_date',
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

/**
 * @description - Transform issues for spreadsheet (Table) Layout view
 * @param {ITask[]} issues - Tasks to be trasnformed
 * @returns Tranformed by target date Issues
 */
export function nonGroupedIssues(issues: ITask[]) {
	return {
		grouped_by: null,
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
		results: issues.map((issue) => issueTransformer(issue)),
	};
}

export const taskRelations = [
	'tags',
	'teams',
	'members',
	'members.user',
	'creator',
	'project.members.employee.user.role',
	'organizationSprint',
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
	relations?: string[],
): Record<string, any> => {
	// Base queries
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery(),
	};

	if (projectId) {
		query['where[projectId]'] = projectId;
	}

	if (options?.module) {
		query['join[alias]'] = 'task';
		// query['where[modules][0]'] = options.module;
	}

	if (options?.creatorId) {
		query['where[creatorId]'] = options.creatorId;
	}

	// Add relations
	if (relations) {
		relations.forEach((relation, i) => {
			query[`relations[${i}]`] = relation;
		});
	} else {
		taskRelations.forEach((relation, i) => {
			query[`relations[${i}]`] = relation;
		});
	}

	return query;
};

export const getFilteredByDatesTaskQuery = (
	options: ITaskDateFilterInput,
): Record<string, any> => {
	// Base queries
	const query: Record<string, any> = {
		organizationId: defaultOrganizationId(),
		tenantId: defaultTestTenantId(),
	};

	Object.keys(options).forEach((key) => {
		const value = options[key as keyof ITaskDateFilterInput];
		if (value !== undefined && value !== null) {
			query[`${key}`] = value;
		}
	});

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
		tenantId: defaultTestTenantId(),
		organizationId: defaultOrganizationId(),
		modules:
			issue.module_ids?.map(
				(id) => ({ id }) as IOrganizationProjectModule,
			) || [],
	};
}

export function updateIssueInputTransformer(
	issue: IIssueUpdateInput,
	status: TaskStatusEnum,
	members?: IEmployee[],
	tags?: IIssueLabel[],
	modulesIds?: ID[],
	modules?: IOrganizationProjectModule[],
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
			acc['organizationId'] = defaultOrganizationId();

			if (issue.module_ids || issue.modules) {
				acc['modules'] = modules
					.filter((module) => modulesIds.includes(module.id))
					.map((module) => ({ id: module.id, name: module.name }));
			}

			return acc;
		},
		{} as ITaskUpdateInput,
	);

	// Add tags only if label_ids is defined
	if (issue.label_ids) {
		transformedInput.tags = tags
			.filter((tag) => issue.label_ids.includes(tag.id))
			.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color }));
	}

	// Add members only if assignee_ids is defined
	if (issue.assignee_ids) {
		transformedInput.members = members
			.filter((member) => issue.assignee_ids.includes(member.id))
			.map((employee) => ({
				id: employee.id,
				fullName: employee.fullName,
				userId: employee.userId,
			}));
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

/**
 * Categorizes tasks by their priority and returns the count for each priority level.
 *
 * This function filters the list of tasks based on their priority and returns the count
 * of tasks for each priority level (urgent, high, medium, low, and none).
 *
 * @param {ITask[]} tasks - The array of tasks to be categorized by priority.
 * @returns {Array<{ priority: string; count: number }>} An array of objects containing the priority and the count of tasks with that priority.
 */
export function issuesByPriority(
	tasks: ITask[],
): { priority: string; count: number }[] {
	// Mapping of priorities to their corresponding filters
	const priorityMapping = {
		urgent: TaskPriorityEnum.URGENT,
		high: TaskPriorityEnum.HIGH,
		medium: TaskPriorityEnum.MEDIUM,
		low: TaskPriorityEnum.LOW,
		none: null, // Tasks without a priority
	};

	// Count tasks for each priority
	return Object.entries(priorityMapping).map(([priority, value]) => ({
		priority,
		count: tasks.filter(
			(task) =>
				task.priority === value || (value === null && !task.priority),
		).length,
	}));
}
