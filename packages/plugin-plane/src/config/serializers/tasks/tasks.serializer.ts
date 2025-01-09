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
	IssueOrderByField,
	ITag,
	ITask,
	ITaskCreateInput,
	ITaskDateFilterInput,
	ITaskUpdateInput,
	TaskPriorityEnum,
	TaskStatusEnum
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { stateGroup } from './statuses';
import { defaultOrganizationId, defaultTestTenantId } from '../../credentials';
import { issueRelationTransformer } from './issue-relations';
import { orderByDirection, orderByFieldTransformer } from '../../utils';

/**
 * Extracts the IDs of the assignees from a given issue.
 *
 * @param {ITask} issue - The issue object from which to extract assignee IDs.
 *   The `issue` should have a `members` property containing an array of assignee objects.
 * @returns {ID[]} An array of assignee IDs.
 *   If no assignees are found, the function returns `undefined` or an empty array.
 */
export function issueAssigneesIds(issue: ITask): ID[] {
	const assignees = issue?.members;

	return assignees?.map((member) => member.id);
}

/**
 * Extracts the IDs of the labels (tags) from a given issue.
 *
 * @param {ITask} issue - The issue object from which to extract label IDs.
 *   The `issue` should have a `tags` property containing an array of label objects.
 * @returns {ID[]} An array of label IDs.
 *   If no labels are found, the function returns `undefined` or an empty array.
 */
export function issueLabelsIds(issue: ITask): ID[] {
	const labels = issue?.tags;

	return labels?.map((tag) => tag.id);
}

/**
 * Transforms an issue object to a standardized format.
 *
 * @param {ITask} issue - The issue object to be transformed.
 *   The `issue` should contain properties such as `id`, `title`, `status`, `priority`, `tags`, etc.
 * @param {IReactionData[]} [reactions] - Optional array of reactions associated with the issue.
 * @param {IIssueLink[]} [links] - Optional array of links associated with the issue.
 * @returns {IIssue} The transformed issue object in a standardized format.
 *   The returned object includes properties like `id`, `name`, `state`, `priority`, `description_html`,
 *   `assignee_ids`, `label_ids`, `cycle_id`, and more.
 *   It also processes optional properties like reactions, links, and sub-issues, providing default values where necessary.
 */
export function issueTransformer(
	issue: ITask,
	reactions?: IReactionData[],
	links?: IIssueLink[],
	is_subscribed?: boolean
): IIssue {
	return {
		id: issue?.id,
		name: issue?.title,
		state: issue?.status,
		state_id: issue?.taskStatusId,
		sort_order: 65535.0, // TODO : Research usecase and add to API
		completed_at: issue?.resolvedAt,
		estimate_point: null, // TODO : Research usecase and add to API
		priority: issue?.priority?.toLocaleLowerCase() as TaskPriorityEnum,
		start_date: issue?.startDate,
		target_date: issue?.dueDate,
		sequence_id: issue?.number,
		project_id: issue?.projectId,
		parent_id: issue?.parentId,
		project__identifier:
			issue?.project?.code ||
			issue?.project?.name?.slice(0, 4).toUpperCase(),
		parent: {
			id: issue?.parent?.id,
			project_id: issue?.parent?.projectId,
			type_id: 'ba32a722-eefd-4a6a-b80f-85eb5d811c22',
			sequence_id: issue?.parent?.number
		},
		created_at: issue?.createdAt,
		updated_at: issue?.updatedAt,
		created_by: issue?.creatorId,
		updated_by: issue?.creatorId,
		is_draft: issue?.isDraft,
		is_subscribed,
		archived_at: issue?.archivedAt,
		state__group: stateGroup(issue?.taskStatus),
		type_id: 'ba32a722-eefd-4a6a-b80f-85eb5d811c22', // TODO : Add to APIs this type as entity
		description_html: issue?.description ?? '<p></p>',
		cycle_id: issue?.organizationSprintId,
		link_count: links?.length || 0,
		attachment_count: 0, // TODO : Add to API,
		sub_issues_count: issue?.children?.length,
		assignee_ids: issueAssigneesIds(issue),
		label_ids: issueLabelsIds(issue),
		module_ids: issue?.modules?.map(({ id }) => id),
		issue_reactions: reactions || [],
		issue_relation: issueRelationTransformer(issue?.linkedIssues) || [],
		issue_link: links || [],
		cycle: issue?.organizationSprint,
		workspace__slug: issue?.tenant?.name?.toLocaleLowerCase()
	};
}

/**
 * Transforms an array of issues into a format suitable for displaying parentable issues.
 *
 * @param {ITask[]} issues - An array of issue objects to be transformed.
 *   Each `issue` should contain properties such as `id`, `title`, `startDate`, `dueDate`, `taskStatus`, etc.
 * @returns An array of transformed issue objects, each containing a subset of the original issue's properties.
 *   The returned objects include properties like `id`, `name`, `start_date`, `target_date`, `sequence_id`, and `project` details.
 *   Additionally, the `workspace__slug` is statically set to "cardano", and the `state__group` is derived from the issue's task status.
 *   Some properties, such as `project__identifier` and `state__color`, are extracted from related objects.
 *   The `type_id` is set to a static value.
 */
export function parentableIssuesTransformer(issues: ITask[]) {
	return issues?.map((issue) => ({
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
		type_id: 'ba32a722-eefd-4a6a-b80f-85eb5d811c22'
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
					total_results: 0
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
			results: {}
		}
	);
}

/**
 * Groups issues by given group and associates their links.
 *
 * @param {Array<{ issue: ITask; issueLinks: any }>} issuesWithLinks - Array of issues and their associated links.
 * @returns A structured object grouping issues certain group, with counts and metadata.
 */
function groupIssues(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	groupByKey: (issue: ITask) => string,
	groupedByLabel: string,
	initialAccumulator: Partial<Record<string, any>> = {}
) {
	return issuesWithLinks.reduce(
		(acc, { issue, issueLinks }) => {
			// Détermine le groupe en utilisant groupByKey
			const group = groupByKey(issue) || 'none';

			// Initialise le groupe si nécessaire
			if (!acc.results[group]) {
				acc.results[group] = {
					results: [],
					total_results: 0
				};
			}

			// Transforme la tâche et ses liens
			const transformedIssue = issueTransformer(issue, [], issueLinks);

			// Ajoute l'élément transformé au groupe
			acc.results[group].results.push(transformedIssue);
			acc.results[group].total_results++;

			// Met à jour les compteurs globaux
			acc.total_results++;
			acc.total_count++;
			acc.count++;
			return acc;
		},
		{
			grouped_by: groupedByLabel,
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
			...initialAccumulator
		}
	);
}

export function groupIssuesByStateGroup(
	issuesWithLinks: { issue: ITask; issueLinks: any }[]
) {
	return groupIssues(
		issuesWithLinks,
		(issue) => stateGroup(issue.taskStatus), // Define the group by state
		'state__group',
		{ total_count: 5, next_cursor: '30:1:0', prev_cursor: '30:-1:1' } // Specific values for initial accumulator.
	);
}

export function groupIssuesByPriority(
	issuesWithLinks: { issue: ITask; issueLinks: any }[]
) {
	return groupIssues(
		issuesWithLinks,
		(issue) => issue.priority || 'none', // Define the group by priority
		'priority'
	);
}

export function groupIssuesByProjectId(
	issuesWithLinks: { issue: ITask; issueLinks: any }[]
) {
	return groupIssues(
		issuesWithLinks,
		(issue) => issue.projectId || 'none', // Define the group by project Id
		'project_id'
	);
}

export function userWorkNonGroupedIssues(
	issuesWithLinks: { issue: ITask; issueLinks: any }[]
) {
	return {
		grouped_by: null,
		sub_grouped_by: null,
		total_count: issuesWithLinks?.length,
		next_cursor: null,
		prev_cursor: null,
		next_page_results: false,
		prev_page_results: false,
		count: issuesWithLinks?.length,
		total_pages: 1,
		total_results: issuesWithLinks?.length,
		extra_stats: null,
		results: issuesWithLinks?.map((issueLink) =>
			issueTransformer(issueLink.issue, [], issueLink.issueLinks)
		)
	};
}

/**
 * Groups issues by their labels and transforms the issues accordingly.
 *
 * @param {Array<{ issue: ITask, issueLinks: any }>} issuesWithLinks - Array of issues with associated links.
 *   Each item contains an issue and the related issue links.
 * @returns The grouped issues by label.
 */
export function groupIssuesByLabel(
	issuesWithLinks: { issue: ITask; issueLinks: any }[]
) {
	return issuesWithLinks.reduce(
		(acc, { issue, issueLinks }) => {
			// Extract the labels (tags) from the issue, defaulting to "None" if none exist
			const tags = issue.tags?.length
				? issue.tags
				: [{ id: 'None', name: 'None', color: null }];

			// Iterate over each tag to group the issue accordingly
			tags.forEach((tag) => {
				// Initialize the tag group if it doesn't exist
				if (!acc.results[tag.id]) {
					acc.results[tag.id] = {
						results: [],
						total_results: 0
					};
				}

				// Transform the issue and its links
				const transformedIssue = issueTransformer(
					issue,
					[],
					issueLinks
				);

				// Add the transformed issue to the current tag group
				acc.results[tag.id].results.push(transformedIssue);
				acc.results[tag.id].total_results++;
			});

			// Increment the global total results counter
			acc.total_results++;
			acc.total_count++;
			acc.count++;
			return acc;
		},
		// Initial accumulator object
		{
			grouped_by: 'labels__id',
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
			results: {}
		}
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
					total_results: 0
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
			results: {}
		}
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
		total_count: issues?.length,
		next_cursor: '30:1:0',
		prev_cursor: '30:-1:1',
		next_page_results: false,
		prev_page_results: false,
		count: issues?.length,
		total_pages: 1,
		total_results: issues?.length,
		extra_stats: null,
		results: issues?.map((issue) => issueTransformer(issue))
	};
}

export const taskRelations = [
	'tags',
	'members.user',
	'creator',
	'project.members.employee.user.role',
	'organizationSprint',
	'linkedIssues.taskTo',
	'linkedIssues.taskFrom',
	'parent',
	'children.taskStatus',
	'taskStatus',
	'modules'
];

export const getTaskQuery = (
	projectId?: ID,
	options?: IIssueFindInput,
	relations?: string[],
	orderByField?: IssueOrderByField,
	isDraft?: boolean
): Record<string, any> => {
	// Base queries
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	if (projectId) {
		query['where[projectId]'] = projectId;
	}

	if (options?.module) {
		query['join[alias]'] = 'task';
		query['where[modules][0]'] = options.module;
	}

	if (options?.cycle && !options.cycle.includes(',')) {
		query['where[organizationSprintId]'] = options.cycle;
	}

	if (options?.creatorId) {
		query['where[creatorId]'] = options.creatorId;
	}

	if (typeof isDraft !== 'undefined') {
		query['where[isDraft]'] = isDraft;
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

	if (orderByField) {
		const orderField = orderByFieldTransformer(orderByField);
		const orderDirection = orderByDirection(orderByField);
		query['order'] = { [orderField]: orderDirection };
	}

	return query;
};

/**
 * Filters a list of tasks to include only those with specified priority names.
 *
 * @param {ITask[]} tasks - The list of tasks to filter.
 * @param {string[]} priorities - The priority names to include in the result.
 * @returns {ITask[]} A filtered array of tasks matching the specified priorities.
 */
export function filterIssuesByPriorityNames(
	tasks: ITask[],
	priorities: string[]
): ITask[] {
	return tasks.filter((task) => {
		const taskPriority = task.priority ?? 'none';
		return priorities.includes(taskPriority);
	});
}

/**
 * Filters an array of tasks based on their status IDs.
 *
 * @param {ITask[]} tasks - The array of tasks to filter.
 * @param {string[]} statusIds - The list of status IDs to include in the filtered result.
 * @returns {ITask[]} An array of tasks that have a `taskStatusId` matching one of the specified `statusIds`.
 */
export function filterIssuesByStatusIds(
	tasks: ITask[],
	statusIds: ID[]
): ITask[] {
	return tasks.filter((task) => {
		return statusIds.includes(task.taskStatusId);
	});
}

/**
 * Filters an array of tasks based on the IDs of assigned members.
 *
 * @param {ITask[]} tasks - The array of tasks to filter.
 * @param {ID[]} assigneeIds - The list of assignee IDs to include in the filtered result.
 * @returns {ITask[]} An array of tasks where at least one member's ID matches one of the specified `assigneeIds`.
 */
export function filterIssuesByAssigneeIds(
	tasks: ITask[],
	assigneeIds: ID[]
): ITask[] {
	return tasks.filter((task) => {
		const taskAssigneess = task.members ?? [];
		return taskAssigneess.some((assignee) =>
			assigneeIds.includes(assignee.id)
		);
	});
}

/**
 * Filters an array of tasks based on their cycle IDs.
 *
 * @param {ITask[]} tasks - The array of tasks to filter.
 * @param {string[]} cycleIds - The list of cycle IDs to include in the filtered result.
 * @returns {ITask[]} An array of tasks that have a `organizationSprintId` matching one of the specified `cycleIds`.
 */
export function filterIssuesByCyclesIds(
	tasks: ITask[],
	cycleIds: ID[]
): ITask[] {
	return tasks.filter((task) => {
		return cycleIds.includes(task.organizationSprintId);
	});
}

export function getFilteredByDatesTaskQuery(
	options: ITaskDateFilterInput
): Record<string, any> {
	// Base queries
	const query: Record<string, any> = {
		organizationId: defaultOrganizationId(),
		tenantId: defaultTestTenantId()
	};

	Object.keys(options).forEach((key) => {
		const value = options[key as keyof ITaskDateFilterInput];
		if (value !== undefined && value !== null) {
			query[`${key}`] = value;
		}
	});

	if (!options.relations) {
		taskRelations.forEach((relation, i) => {
			query[`relations[${i}]`] = relation;
		});
	}

	return query;
}

export function createIssueInputTransformer(
	issue: IIssueCreateInput,
	status: TaskStatusEnum
): ITaskCreateInput {
	const tags = issue?.label_ids
		? issue?.label_ids?.map((id) => ({ id }) as ITag)
		: [];
	const members = issue?.assignee_ids
		? issue?.assignee_ids?.map((id) => ({ id }) as IEmployee)
		: [];

	// TODO : Include mention here
	return {
		title: issue?.name,
		description: issue?.description_html,
		priority: issue?.priority,
		startDate: issue?.start_date,
		dueDate: issue?.target_date,
		projectId: issue?.project_id,
		isDraft: issue?.is_draft || false,
		status,
		tags,
		members,
		organizationSprintId: issue?.cycle_id,
		parentId: issue?.parent_id,
		taskStatusId: issue?.state_id?.length > 0 ? issue?.state_id : null,
		tenantId: defaultTestTenantId(),
		organizationId: defaultOrganizationId(),
		modules:
			issue?.module_ids?.map(
				(id) => ({ id }) as IOrganizationProjectModule
			) || []
	};
}

export function updateIssueInputTransformer(
	issue: IIssueUpdateInput,
	status: TaskStatusEnum,
	members?: IEmployee[],
	tags?: IIssueLabel[],
	modulesIds?: ID[],
	modules?: IOrganizationProjectModule[]
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
		is_draft: 'isDraft',
		cycle_id: 'organizationSprintId',
		parent_id: 'parentId',
		state_id: 'taskStatusId',
		module_ids: 'modules'
	};

	// TODO : Include mention here

	// Include only user provided flelds in the final request
	const transformedInput: ITaskUpdateInput = Object.entries(
		keyMapping
	).reduce(
		(
			acc: Partial<Omit<ITaskUpdateInput, 'parent'>>,
			[issueKey, taskKey]
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
					?.filter((module) => modulesIds.includes(module.id))
					?.map((module) => ({ id: module.id, name: module.name }));
			}

			return acc;
		},
		{} as ITaskUpdateInput
	);

	// Add tags only if label_ids is defined
	if (issue.label_ids) {
		transformedInput.tags = tags
			?.filter((tag) => issue.label_ids.includes(tag.id))
			?.map((tag) => ({ id: tag.id, name: tag.name, color: tag.color }));
	}

	// Add members only if assignee_ids is defined
	if (issue.assignee_ids) {
		transformedInput.members = members
			?.filter((member) => issue.assignee_ids.includes(member.id))
			?.map((employee) => ({
				id: employee.id,
				fullName: employee.fullName,
				userId: employee.userId
			}));
	}

	return transformedInput;
}

export function getTaskDistribution(tasks: ITask[]) {
	const stateDistribution: ICompletedIssuesDistribution = {
		completed: [],
		started: [],
		unstarted: [],
		backlog: []
	};

	const statusMap: { [key: string]: keyof typeof stateDistribution } = {
		[TaskStatusEnum.DONE.toLocaleLowerCase()]: 'completed',
		[TaskStatusEnum.COMPLETED.toLocaleLowerCase()]: 'completed',
		[TaskStatusEnum.IN_PROGRESS.toLocaleLowerCase()]: 'started',
		[TaskStatusEnum.READY_FOR_REVIEW.toLocaleLowerCase()]: 'started',
		[TaskStatusEnum.IN_REVIEW.toLocaleLowerCase()]: 'started',
		[TaskStatusEnum.BLOCKED.toLocaleLowerCase()]: 'started',
		[TaskStatusEnum.OPEN.toLocaleLowerCase()]: 'unstarted',
		[TaskStatusEnum.BACKLOG.toLocaleLowerCase()]: 'backlog'
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
	tasks: ITask[]
): { priority: string; count: number }[] {
	// Mapping of priorities to their corresponding filters
	const priorityMapping = {
		urgent: TaskPriorityEnum.URGENT,
		high: TaskPriorityEnum.HIGH,
		medium: TaskPriorityEnum.MEDIUM,
		low: TaskPriorityEnum.LOW,
		none: null // Tasks without a priority
	};

	// Count tasks for each priority
	return Object.entries(priorityMapping)?.map(([priority, value]) => ({
		priority,
		count: tasks.filter(
			(task) =>
				task.priority === value || (value === null && !task.priority)
		).length
	}));
}
