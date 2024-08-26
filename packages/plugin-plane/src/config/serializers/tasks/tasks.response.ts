import { ID, IIssue, ITask } from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { stateGroup } from './statuses';

export function issueAssigneesIds(issue: ITask): ID[] {
	const assignees = issue.members;

	return assignees.map((member) => member.id);
}

export function issueLabelsIds(issue: ITask): ID[] {
	const labels = issue.tags;

	return labels.map((member) => member.id);
}

export function issueTransformer(issue: ITask): IIssue {
	return {
		id: issue.id,
		name: issue.title,
		state_id: issue.taskStatusId,
		sort_order: 65535.0, // TODO : Research usecase and add to API
		completed_at: issue.resolvedAt,
		estimate_point: null, // TODO : Research usecase and add to API
		priority: issue.priority.toLocaleLowerCase(),
		start_date: issue.startDate,
		target_date: issue.dueDate,
		sequence_id: 1, // TODO : Research usecase and add to API
		project_id: issue.projectId,
		parent_id: issue.parentId,
		created_at: issue.createdAt,
		updated_at: issue.updatedAt,
		created_by: issue.creatorId,
		updated_by: issue.creatorId, // TODO : Add to API
		is_draft: false, // TODO : Add to API
		archived_at: null, // TODO : Add to API
		state__group: stateGroup(issue.taskStatus),
		type_id: 'ba32a722-eefd-4a6a-b80f-85eb5d811c22', // TODO : Add to APIs this type as entity
		cycle_id: issue.organizationSprintId,
		link_count: 0, // TODO: Add to API
		attachment_count: 0, // TODO : Add to API,
		sub_issues_count: issue.children?.length,
		assignee_ids: issueAssigneesIds(issue),
		label_ids: issueLabelsIds(issue),
		module_ids: [], // TODO: Add to APIs
	};
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
	'linkedIssues',
	'linkedIssues.taskTo',
	'linkedIssues.taskFrom',
	'parent',
	'children',
	'taskStatus',
];

export const getTaskQuery = (id: ID): Record<string, string> => {
	// Base queries
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery,
		'where[projectId]': id,
		// 'join[alias]': 'task',
		// 'join[leftJoinAndSelect][members]': 'task.members',
		// 'join[leftJoinAndSelect][user]': 'members.user',
	};

	// Add relations
	taskRelations.forEach((relation, i) => {
		query[`relations[${i}]`] = relation;
	});

	return query;
};
