import moment from 'moment';
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
	IssueFindByTypeEnum,
	IssueGroupByEnum,
	IssueManyToManyGroupCriteria,
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
import { currentTenantId, getCurrentOrganizationSlug } from '../../credentials';
import { issueRelationTransformer } from './issue-relations';
import {
	deslugify,
	extractEmployeeMentionIds,
	issueFilterSplitter,
	orderByDirection,
	orderByFieldTransformer,
	sluggify
} from '../../utils';

/**
 * Task default relations
 */
export const taskRelations = [
	'tags',
	'members.user',
	'createdByUser',
	'project.members.employee.user.role',
	'organizationSprint',
	'linkedIssues.taskTo',
	'linkedIssues.taskFrom',
	'parent',
	'children.taskStatus',
	'taskStatus',
	'modules'
];

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
			type_id: issue?.parent?.taskTypeId,
			sequence_id: issue?.parent?.number
		},
		created_at: issue?.createdAt,
		updated_at: issue?.updatedAt,
		created_by: issue?.createdByUserId,
		updated_by: issue?.createdByUserId,
		is_draft: issue?.isDraft,
		is_subscribed,
		archived_at: issue?.archivedAt,
		state__group: stateGroup(issue?.taskStatus),
		type_id: issue?.taskTypeId,
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
 *   Some properties, such as `project__identifier` and `state__color`, are extracted from related objects.
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
		workspace__slug: getCurrentOrganizationSlug(),
		state__name: issue.taskStatus?.name,
		state__group: stateGroup(issue.taskStatus),
		state__color: issue.taskStatus?.color,
		type_id: issue.taskTypeId
	}));
}

export function getGroupKeyForCriteria(
	issue: ITask,
	criteria: IssueGroupByEnum,
	employees?: IEmployee[]
): string | string[] {
	switch (criteria) {
		case IssueGroupByEnum.ASSIGNEE_ID:
			return issue.members?.map((member) => member.id) || ['None'];
		case IssueGroupByEnum.CREATED_BY:
			const creator = employees?.find(
				(emp) => emp.userId === issue.createdByUserId
			);
			return creator ? creator.id : 'None';
		case IssueGroupByEnum.CYCLE_ID:
			return issue.organizationSprintId || 'None';
		case IssueGroupByEnum.LABEL_ID:
			return issue.tags?.map((tag) => tag.id) || ['None'];
		case IssueGroupByEnum.MODULE_ID:
			return issue.modules?.map((module) => module.id) || ['None'];
		case IssueGroupByEnum.PRIORITY:
			return issue.priority || 'none';
		case IssueGroupByEnum.PROJECT_ID:
			return issue.projectId || 'none';
		case IssueGroupByEnum.STATE:
			return issue.taskStatusId || 'none';
		case IssueGroupByEnum.STATE_GROUP:
			return issue.taskStatus ? stateGroup(issue.taskStatus) : 'none';
		default:
			return 'none';
	}
}

/**
 * Groups issues based on a specified key and transforms them into a grouped structure.
 *
 * This function processes a list of issues along with their associated links, groups them
 * by a key derived from the provided `groupByKey` function, and transforms them into a
 * structured output with metadata.
 *
 * @param {{ issue: ITask; issueLinks: any }[]} issuesWithLinks - Array of objects containing issues and their associated links.
 * @param {(issue: ITask) string} groupByKey - Function to determine the grouping key for each issue.
 * @param {string} groupedByLabel - Label describing the grouping criteria.
 * @param {Partial<Record<string, any>>} [initialAccumulator={}] - Optional initial accumulator object to be merged with the default accumulator.
 * @returns {Record<string, any>} An object containing grouped issues, metadata, and statistics.
 */
function groupIssues(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	groupByKey: (issue: ITask) => string,
	groupedByLabel: string,
	subGroupByKey?: (issue: ITask) => string | string[],
	subGroupByKeyLabel?: string,
	initialAccumulator: Partial<Record<string, any>> = {}
): Record<string, any> {
	const addToGroup = (
		group: any,
		issue: ITask,
		issueLinks: any,
		subGroup?: string
	) => {
		const transformedIssue = issueTransformer(issue, [], issueLinks);

		if (subGroup) {
			// Initialize subgroup if not present
			if (!group[subGroup]) {
				group[subGroup] = { results: [], total_results: 0 };
			}
			group[subGroup].results.push(transformedIssue);
			group[subGroup].total_results++;
		} else {
			// Initialize group results if not present
			if (!group.results) {
				group.results = [];
				group.total_results = 0;
			}
			group.results.push(transformedIssue);
			group.total_results++;
		}
	};

	return issuesWithLinks.reduce(
		(acc, { issue, issueLinks }) => {
			const group = groupByKey(issue) || 'none';

			// Initialize the group if not present
			if (!acc.results[group]) {
				acc.results[group] = subGroupByKeyLabel
					? { results: {}, total_results: 0 }
					: { results: [], total_results: 0 };
			}

			if (subGroupByKeyLabel) {
				// Handle subgrouping
				const subGroups = subGroupByKey?.(issue) || ['none'];
				const subGroupArray = Array.isArray(subGroups)
					? subGroups
					: [subGroups]; // Normalize to an array

				subGroupArray.forEach((subGroup) => {
					addToGroup(
						acc.results[group].results,
						issue,
						issueLinks,
						subGroup
					);
				});
			} else {
				// Handle direct grouping without subgroups
				addToGroup(acc.results[group], issue, issueLinks);
			}

			// Recalculate total_results for the group, considering subgroups if applicable
			if (subGroupByKeyLabel) {
				acc.results[group].total_results = Object.values(
					acc.results[group].results
				).reduce(
					(total: number, subGroup: any) =>
						total + (subGroup?.total_results || 0),
					0
				);
			}

			// Update global counters
			acc.total_results++;
			acc.total_count++;
			acc.count++;

			return acc;
		},
		{
			// Initialize accumulator
			grouped_by: groupedByLabel,
			sub_grouped_by: subGroupByKeyLabel || null,
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

/**
 * Groups issues by a specified many-to-many criteria (e.g., tags, members, or modules) and returns a result object with the grouped issues and statistics.
 * If no values are found for the selected criteria, it groups the issues under a default value ('None').
 *
 * @param {Array<{ issue: ITask, issueLinks: any }>} issuesWithLinks - Array of issues with their associated links.
 * @param {IssueManyToManyGroupCriteria} criteria - The criteria by which to group the issues (e.g., 'tags', 'members', 'modules').
 * @returns {Record<string, any>} The result object containing grouped issues and related statistics like total results and pagination info.
 */
export function groupIssuesByManyToManyCriteria(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	criteria: IssueManyToManyGroupCriteria,
	subGroupByKey?: (issue: ITask) => string | string[],
	subGroupByKeyLabel?: string
): Record<string, any> {
	return issuesWithLinks.reduce(
		(acc, { issue, issueLinks }) => {
			// Extract the values according to the chosed criteria
			let groupItems: any;
			switch (criteria) {
				case 'tags':
					groupItems = issue.tags?.length
						? issue.tags
						: [{ id: 'None', name: 'None', color: null }];
					break;
				case 'members':
					groupItems = issue.members?.length
						? issue.members
						: [{ id: 'None', name: 'None', color: null }];
					break;
				case 'modules':
					groupItems = issue.modules?.length
						? issue.modules
						: [{ id: 'None', name: 'None' }];
					break;
				default:
					groupItems = [];
			}

			// Group according to each element of criteria
			groupItems.forEach((item: any) => {
				// Initialize the group if not exist
				if (!acc.results[item.id]) {
					acc.results[item.id] = subGroupByKeyLabel
						? { results: {}, total_results: 0 }
						: { results: [], total_results: 0 };
				}

				// Transform the issue with its links
				const transformedIssue = issueTransformer(
					issue,
					[],
					issueLinks
				);

				if (subGroupByKeyLabel) {
					// Handle subgroups
					const subGroups = subGroupByKey?.(issue) || ['none'];
					const subGroupArray = Array.isArray(subGroups)
						? subGroups
						: [subGroups]; // Normalize to an array

					subGroupArray.forEach((subGroup) => {
						// Initialize subgroup if not present
						if (!acc.results[item.id].results[subGroup]) {
							acc.results[item.id].results[subGroup] = {
								results: [],
								total_results: 0
							};
						}

						// Add the transformed issue to the subgroup
						acc.results[item.id].results[subGroup].results.push(
							transformedIssue
						);
						acc.results[item.id].results[subGroup].total_results++;
					});

					// Update total_results for the main group
					acc.results[item.id].total_results = Object.values(
						acc.results[item.id].results
					).reduce(
						(total: number, subGroup: any) =>
							total + (subGroup?.total_results || 0),
						0
					);
				} else {
					// Add the transformed issue directly to the group
					acc.results[item.id].results.push(transformedIssue);
					acc.results[item.id].total_results++;
				}
			});

			// Increment global counters
			acc.total_results++;
			acc.total_count++;
			acc.count++;

			return acc;
		},
		{
			grouped_by:
				criteria === 'tags'
					? 'labels__id'
					: criteria === 'members'
						? 'assignee__id'
						: 'issue_module__module_id',
			sub_grouped_by: subGroupByKeyLabel || null,
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
 * @description - Group issues by state ID for Kanban and list Layouts
 * @param {Array<{ issue: ITask, issueLinks: any }>} issuesWithLinks - Tasks to be trasnformed and grouped
 * @returns Tranformed and grouped by state Issues
 */
export function groupIssuesByStateId(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	subGroupby?: IssueGroupByEnum,
	employees?: IEmployee[]
) {
	return groupIssues(
		issuesWithLinks,
		(issue) => issue.taskStatusId, // Define the group by state ID
		'state_id',
		(issue) => getGroupKeyForCriteria(issue, subGroupby, employees),
		subGroupby
	);
}

/**
 * Groups issues by their state group and returns a result object with the grouped issues and related statistics.
 * The state group is determined by the task status of each issue.
 *
 * @param {Array<{ issue: ITask, issueLinks: any }>} issuesWithLinks - Array of issues with their associated links.
 * @returns {Record<string, any>} The result object containing grouped issues and statistics like total results and pagination info.
 */
export function groupIssuesByStateGroup(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	subGroupby?: IssueGroupByEnum,
	employees?: IEmployee[]
): Record<string, any> {
	return groupIssues(
		issuesWithLinks,
		(issue) => stateGroup(issue.taskStatus), // Define the group by state
		'state__group',
		(issue) => getGroupKeyForCriteria(issue, subGroupby, employees),
		subGroupby,
		{ total_count: 5, next_cursor: '30:1:0', prev_cursor: '30:-1:1' } // Specific values for initial accumulator.
	);
}

/**
 * Groups issues by their state group and applies an initial accumulator with specific values.
 *
 * This function utilizes `groupIssues` to categorize issues based on their state group,
 * determined by the `stateGroup` function applied to the `taskStatus` property of each issue.
 *
 * @param {{ issue: ITask; issueLinks: any }[]} issuesWithLinks - Array of objects containing issues and their associated links.
 * @returns {Record<string, any>} An object containing grouped issues by state group, metadata, and statistics.
 */
export function groupIssuesByPriority(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	subGroupby?: IssueGroupByEnum,
	employees?: IEmployee[]
): Record<string, any> {
	return groupIssues(
		issuesWithLinks,
		(issue) => issue.priority || 'none', // Define the group by priority
		'priority',
		(issue) => getGroupKeyForCriteria(issue, subGroupby, employees),
		subGroupby
	);
}

/**
 * Groups issues by their associated project ID.
 *
 * This function uses `groupIssues` to organize issues based on their `projectId`.
 * If an issue does not have a `projectId`, it is grouped under the key `'none'`.
 *
 * @param {{ issue: ITask; issueLinks: any }[]} issuesWithLinks - Array of objects containing issues and their associated links.
 * @returns {Record<string, any>} An object containing grouped issues by project ID, metadata, and statistics.
 */
export function groupIssuesByProjectId(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	subGroupby?: IssueGroupByEnum,
	employees?: IEmployee[]
): Record<string, any> {
	return groupIssues(
		issuesWithLinks,
		(issue) => issue.projectId || 'none', // Define the group by project Id
		'project_id',
		(issue) => getGroupKeyForCriteria(issue, subGroupby, employees),
		subGroupby
	);
}

/**
 * Groups issues by their associated sprint (cycle) ID.
 *
 * This function uses `groupIssues` to organize issues based on their `organizationSprintId`.
 * If an issue does not have an `organizationSprintId`, it is grouped under the key `'None'`.
 *
 * @param {{ issue: ITask; issueLinks: any }[]} issuesWithLinks - Array of objects containing issues and their associated links.
 * @returns {Record<string, any>} An object containing grouped issues by sprint (cycle) ID, metadata, and statistics.
 */
export function groupIssuesByCycleId(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	subGroupby?: IssueGroupByEnum,
	employees?: IEmployee[]
): Record<string, any> {
	return groupIssues(
		issuesWithLinks,
		(issue) => issue.organizationSprintId || 'None', // Define the group by sprint Id
		'cycle_id',
		(issue) => getGroupKeyForCriteria(issue, subGroupby, employees),
		subGroupby
	);
}

/**
 * Groups issues by their creator's user ID. If no matching member is found, issues are grouped under 'None'.
 * The creator is determined by matching the `creatorId` with the `userId` of the members in the issue.
 *
 * @param {Array<{ issue: ITask, issueLinks: any }>} issuesWithLinks - Array of issues with their associated links.
 * @returns {Record<string, any>} The result object containing grouped issues by creator's user ID.
 */
export function groupIssuesByCreatorId(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	subGroupby?: IssueGroupByEnum,
	employees?: IEmployee[]
): Record<string, any> {
	return groupIssues(
		issuesWithLinks,
		(issue) => {
			const member = employees.find(
				(member) => member.userId === issue.createdByUserId
			);
			return member?.id || 'None';
		},
		'created_by',
		(issue) => getGroupKeyForCriteria(issue, subGroupby, employees),
		subGroupby
	);
}

/**
 * Returns a flat list of issues without any grouping, including their transformed data and metadata.
 *
 * This function provides a response structure where issues are not grouped but transformed
 * for presentation or processing. It includes metadata about the total count, pagination, and more.
 *
 * @param {{ issue: ITask; issueLinks: any }[]} issuesWithLinks - Array of objects containing issues and their associated links.
 * @returns {Record<string, any>} An object containing ungrouped issues, metadata, and statistics.
 */
export function userWorkNonGroupedIssues(
	issuesWithLinks: { issue: ITask; issueLinks: any }[]
): Record<string, any> {
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
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	subGroupby?: IssueGroupByEnum,
	employees?: IEmployee[]
) {
	return groupIssuesByManyToManyCriteria(
		issuesWithLinks,
		'tags',
		(issue) => getGroupKeyForCriteria(issue, subGroupby, employees),
		subGroupby
	);
}

/**
 * Groups issues by assignee (member) and returns a result object with the grouped issues and related stats.
 * If an issue has no assignees, it is grouped under a default member with the ID 'None'.
 *
 * @param {Array<{ issue: ITask, issueLinks: any }>} issuesWithLinks - Array of issues with their associated links.
 * @returns {Record<string, any>} Grouped issues by assignee with statistics like total results and pagination info.
 */
export function groupIssuesByAssignee(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	subGroupby?: IssueGroupByEnum,
	employees?: IEmployee[]
): Record<string, any> {
	return groupIssuesByManyToManyCriteria(
		issuesWithLinks,
		'members',
		(issue) => getGroupKeyForCriteria(issue, subGroupby, employees),
		subGroupby
	);
}

/**
 * Groups a list of issues by their modules and returns an object containing the grouped issues and other related stats.
 * If an issue does not have any modules, it will be grouped under a default module with the ID 'None'.
 *
 * @param {Array<{ issue: ITask, issueLinks: any }>} issuesWithLinks - An array of objects where each object contains an issue (`ITask`) and its associated links.
 * @returns {Record<string, any>} The result object with grouped issues by module, along with other statistics like total results, page information, and more.
 */
export function groupIssuesByModule(
	issuesWithLinks: { issue: ITask; issueLinks: any }[],
	subGroupby?: IssueGroupByEnum,
	employees?: IEmployee[]
): Record<string, any> {
	return groupIssuesByManyToManyCriteria(
		issuesWithLinks,
		'modules',
		(issue) => getGroupKeyForCriteria(issue, subGroupby, employees),
		subGroupby
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

/**
 * Normalizes filter structure from {"and": [...]} format to a flat object
 * @param filters - Filter object that may contain an "and" array structure
 * @returns Normalized flat filter object
 */
function normalizeFilters(filters: any): Record<string, any> {
	if (!filters || typeof filters !== 'object') {
		return {};
	}

	// If filters has an "and" array, merge all conditions into a flat object
	if (Array.isArray(filters.and)) {
		const normalizedFilters: Record<string, any> = {};
		// Temporary storage for date values that need to be merged
		const startDateValues: string[] = [];
		const targetDateValues: string[] = [];

		filters.and.forEach((condition: Record<string, any>) => {
			if (condition && typeof condition === 'object') {
				Object.keys(condition).forEach((key) => {
					const value = condition[key];

					// Special handling for date filters - collect all values
					if (
						key === 'start_date__exact' ||
						key === 'start_date__range'
					) {
						const dates =
							typeof value === 'string' && value.includes(',')
								? value.split(',')
								: [value];
						startDateValues.push(...dates);
						return;
					}

					if (
						key === 'target_date__exact' ||
						key === 'target_date__range'
					) {
						const dates =
							typeof value === 'string' && value.includes(',')
								? value.split(',')
								: [value];
						targetDateValues.push(...dates);
						return;
					}

					// If key already exists, merge values
					if (normalizedFilters[key]) {
						// Convert existing value to array if it's not already
						const existingValues = Array.isArray(
							normalizedFilters[key]
						)
							? normalizedFilters[key]
							: [normalizedFilters[key]];

						// Handle new value - split if it's a comma-separated string
						const newValues =
							typeof value === 'string' && value.includes(',')
								? value.split(',')
								: [value];

						// Merge and deduplicate
						const mergedConditions = [
							...existingValues,
							...newValues
						];
						normalizedFilters[key] =
							mergedConditions.length === 1
								? mergedConditions[0]
								: mergedConditions.join(',');
					} else {
						// First occurrence - keep as is (string with commas or single value)
						normalizedFilters[key] = value;
					}
				});
			}
		});

		// Merge all start date values into a single key (deduplicate)
		if (startDateValues.length > 0) {
			const uniqueStartDates = [...new Set(startDateValues)];
			normalizedFilters.start_date__exact =
				uniqueStartDates.length === 1
					? uniqueStartDates[0]
					: uniqueStartDates.join(',');
			normalizedFilters.start_date__range =
				uniqueStartDates.length === 1
					? uniqueStartDates[0]
					: uniqueStartDates.join(',');
		}

		// Merge all target date values into a single key (deduplicate)
		if (targetDateValues.length > 0) {
			const uniqueTargetDates = [...new Set(targetDateValues)];
			normalizedFilters.target_date__exact =
				uniqueTargetDates.length === 1
					? uniqueTargetDates[0]
					: uniqueTargetDates.join(',');
			normalizedFilters.target_date__range =
				uniqueTargetDates.length === 1
					? uniqueTargetDates[0]
					: uniqueTargetDates.join(',');
		}

		return normalizedFilters;
	}

	// If filters is already a flat object, return as is
	return filters;
}

/**
 * Builds a query object for fetching tasks based on various filters and options.
 *
 * @param projectId - The ID of the project to filter tasks by.
 * @param options - An object containing filter options such as assignees, state, labels, etc.
 * @param relations - Optional array of related entities to include in the response.
 * @param orderByField - Optional field used to order the results.
 * @param isDraft - Optional flag to include only draft tasks.
 * @returns A query object formatted for the backend to retrieve filtered task data.
 */
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

	// Parse filters if it's a string (JSON encoded in URL)
	if (options?.filters && typeof options.filters === 'string') {
		try {
			options.filters = JSON.parse(options.filters);
		} catch (error) {
			// If parsing fails, set filters to empty object
			options.filters = {};
		}
	}

	// Normalize filters structure (handle {"and": [...]} format)
	if (options?.filters) {
		options.filters = normalizeFilters(options.filters);
	}

	const {
		assignees,
		created_by,
		creatorId,
		cycle,
		issues,
		labels,
		module,
		projectId: project_id,
		state,
		filters = {}
	} = options || {};

	if (projectId || project_id) {
		query['where[projectId]'] = projectId;
	}

	if (issues) {
		if (issues.includes(',')) {
			const tasks = issueFilterSplitter(issues);
			tasks.forEach((taskId, i) => {
				query[`filters[id][${i}]`] = taskId;
			});
		} else {
			query[`where[id]`] = issues;
		}
	}

	if (assignees || filters.assignee_id__in) {
		const assigneesValue = assignees || filters.assignee_id__in;
		if (assigneesValue && assigneesValue.includes(',')) {
			const members = issueFilterSplitter(assigneesValue);
			members.forEach((memberId, i) => {
				query[`filters[members][${i}]`] = memberId;
			});
		} else {
			query[`where[members][id]`] = assigneesValue;
		}
	}

	if (created_by || filters.created_by__in) {
		const createdByValue = created_by || filters.created_by__in;
		if (createdByValue && createdByValue.includes(',')) {
			const creators = issueFilterSplitter(createdByValue);
			creators.forEach((creator, i) => {
				query[`filters[createdByUserIds][${i}]`] = creator;
			});
		} else {
			query['where[createdByUserId]'] = createdByValue;
		}
	}

	if (module || filters.module_id__in) {
		const moduleValue = module || filters.module_id__in;
		if (moduleValue && moduleValue.includes(',')) {
			const modules = issueFilterSplitter(moduleValue);
			modules.forEach((mod, i) => {
				query[`filters[modules][${i}]`] = mod;
			});
		} else {
			query['join[alias]'] = 'task';
			query['where[modules][0]'] = moduleValue;
		}
	}

	if (cycle || filters.cycle_id__in) {
		const cycleValue = cycle || filters.cycle_id__in;
		if (cycleValue && !cycleValue.includes(',')) {
			query['where[organizationSprintId]'] = cycleValue;
		} else {
			const sprints = issueFilterSplitter(cycleValue);
			sprints.forEach((sprint, i) => {
				query[`filters[sprints][${i}]`] = sprint;
			});
		}
	}

	if (labels || filters.label_id__in) {
		const tags = issueFilterSplitter(labels || filters.label_id__in);
		tags.forEach((tag, i) => {
			query[`filters[tags][${i}]`] = tag;
		});
	}

	if (state || filters.state_id__in) {
		const stateValue = state || filters.state_id__in;
		if (stateValue && stateValue.includes(',')) {
			const statusIds = issueFilterSplitter(stateValue);
			statusIds.forEach((statusId, i) => {
				query[`filters[statusIds][${i}]`] = statusId;
			});
		} else {
			query['where[taskStatusId]'] = stateValue;
		}
	}

	if (creatorId) {
		query['where[createdByUserId]'] = options.creatorId;
	}

	// Handle priority__in filter
	if (filters.priority__in) {
		const priorities = issueFilterSplitter(filters.priority__in);
		priorities.forEach((priority, i) => {
			query[`filters[priorities][${i}]`] = priority;
		});
	}

	// Handle state_group__in filter
	if (filters.state_group__in) {
		const stateGroups = issueFilterSplitter(filters.state_group__in);
		stateGroups.forEach((stateGroup, i) => {
			query[`filters[statuses][${i}]`] = stateGroup;
		});
	}

	// Handle mention_id__in filter
	if (filters.mention_id__in) {
		const mentions = issueFilterSplitter(filters.mention_id__in);
		mentions.forEach((mention, i) => {
			query[`filters[mentionIds][${i}]`] = mention;
		});
	}

	// Handle date filters - merge all start_date values into one array
	const allStartDates: string[] = [];
	if (filters.start_date__exact) {
		allStartDates.push(...issueFilterSplitter(filters.start_date__exact));
	}
	if (filters.start_date__range) {
		allStartDates.push(...issueFilterSplitter(filters.start_date__range));
	}
	if (allStartDates.length > 0) {
		allStartDates.forEach((date, i) => {
			query[`filters[startDates][${i}]`] = new Date(date);
		});
	}

	// Handle date filters - merge all target_date values into one array
	const allTargetDates: string[] = [];
	if (filters.target_date__exact) {
		allTargetDates.push(...issueFilterSplitter(filters.target_date__exact));
	}
	if (filters.target_date__range) {
		allTargetDates.push(...issueFilterSplitter(filters.target_date__range));
	}
	if (allTargetDates.length > 0) {
		allTargetDates.forEach((date, i) => {
			query[`filters[dueDates][${i}]`] = new Date(date);
		});
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
		if (orderField.length > 0) {
			query['order'] = { [orderField]: orderDirection };
		}
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
 * Filters tasks based on the specified issue type.
 *
 * @param {ITask[]} tasks - The list of tasks to filter.
 * @param {IssueFindByTypeEnum} type - The issue type to filter by (e.g., BACKLOG, ACTIVE).
 * @returns {ITask[]} The filtered list of tasks matching the issue type.
 */
export function filterIssuesByActiveType(
	tasks: ITask[],
	type: IssueFindByTypeEnum
): ITask[] {
	const statusFilters: Record<IssueFindByTypeEnum, string[]> = {
		[IssueFindByTypeEnum.BACKLOG]: [
			TaskStatusEnum.BACKLOG.toLocaleLowerCase()
		],
		[IssueFindByTypeEnum.ACTIVE]: [
			deslugify(TaskStatusEnum.IN_PROGRESS).toLocaleLowerCase(),
			deslugify(TaskStatusEnum.READY_FOR_REVIEW).toLocaleLowerCase(),
			deslugify(TaskStatusEnum.IN_REVIEW).toLocaleLowerCase(),
			deslugify(TaskStatusEnum.BLOCKED).toLocaleLowerCase(),
			deslugify(TaskStatusEnum.OPEN).toLocaleLowerCase()
		]
	};

	const activeStatuses = statusFilters[type];

	return tasks.filter((task) =>
		activeStatuses.includes(task?.status?.toLocaleLowerCase() ?? '')
	);
}

/**
 * Filters tasks based on specified date criteria.
 *
 * @param tasks - The list of tasks to filter.
 * @param criteria - A string representing the filter criteria, e.g.,
 * "2_weeks;after;fromnow,2025-01-14;after,2025-01-24;before".
 * The criteria can include relative dates (`fromnow`) and absolute date ranges (`after` and `before`).
 * @returns - A list of tasks matching the criteria.
 */
export function filterTasksByDateCriteria(
	tasks: ITask[],
	dateField: 'startDate' | 'dueDate',
	criteria: string
): ITask[] {
	// Split the criteria string into individual filters
	const filters = criteria.split(',');

	// Array to store filtering conditions
	const conditions: ((task: ITask) => boolean)[] = [];

	filters.forEach((filter) => {
		// Split the filter into its components
		const parts = filter.split(';');
		let amount: any, unit: any, condition: string;

		if (parts.length === 3) {
			// Case where we have a relative filter (e.g., "2_weeks;after;fromnow")
			[amount, unit, condition] = parts;
		} else if (parts.length === 2) {
			// Case where we have a specific date filter (e.g., "2025-01-14;after")
			[amount, condition] = parts;
		} else {
			// Invalid filter format (you can throw an error or handle this case)
			return;
		}

		// Handling the different conditions
		if (condition === 'fromnow') {
			// Handles relative dates (e.g., "2_weeks;after;fromnow")
			const date = moment()
				.add(
					parseInt(amount, 10),
					unit as moment.unitOfTime.DurationConstructor
				)
				.startOf('day'); // Ensuring the date comparison is from the start of the day
			if (unit && amount) {
				// Add a condition to include tasks starting on or after the calculated date
				conditions.push((task) =>
					moment(task[dateField]).isSameOrAfter(date)
				);
			}
		} else if (condition === 'after') {
			// Handles tasks starting after a specific date (e.g., "2025-01-14;after")
			const date = moment(amount).startOf('day'); // Start of the day for accurate comparison
			conditions.push((task) => moment(task[dateField]).isAfter(date));
		} else if (condition === 'before') {
			// Handles tasks starting before a specific date (e.g., "2025-01-24;before")
			const date = moment(amount).startOf('day'); // Start of the day for accurate comparison
			conditions.push((task) => moment(task[dateField]).isBefore(date));
		}
	});

	// Filter tasks based on the combined conditions
	return tasks.filter((task) =>
		// A task is included if it satisfies at least one condition
		conditions.some((condition) => condition(task))
	);
}

export function getFilteredByDatesTaskQuery(
	options: ITaskDateFilterInput
): Record<string, any> {
	// Base queries
	const query: Record<string, any> = {
		organizationId: getCurrentOrganizationSlug(),
		tenantId: currentTenantId()
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

	// Extract employee IDs mentioned in the issue description
	const mentionedEmployeeIds = extractEmployeeMentionIds(
		issue?.description_html
	);

	return {
		title: issue?.name,
		description: issue?.description_html,
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
		tenantId: currentTenantId(),
		organizationId: getCurrentOrganizationSlug(),
		...(issue.priority !== ('none' as TaskPriorityEnum) && {
			priority: issue.priority
		}),
		modules:
			issue?.module_ids?.map(
				(id) => ({ id }) as IOrganizationProjectModule
			) || [],
		mentionEmployeeIds: mentionedEmployeeIds ?? []
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
		module_ids: 'modules',
		type_id: 'taskTypeId'
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
			acc['organizationId'] = getCurrentOrganizationSlug();

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
		const status = task.status ? sluggify(task.status) : '';
		const category = statusMap[status];

		console.log({ status, category });

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

/**
 * Get query with identifier for a task
 */
export function getTaskByIdentifierQuery(
	identifier: string,
	relations?: string[]
): Record<string, string> {
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery()
	};
	query['where[number]'] = identifier.split('-')[1];
	query['where[project][code]'] = identifier.split('-')[0];

	relations?.forEach((relation, i) => {
		query[`relations[${i}]`] = relation;
	});

	return query;
}
