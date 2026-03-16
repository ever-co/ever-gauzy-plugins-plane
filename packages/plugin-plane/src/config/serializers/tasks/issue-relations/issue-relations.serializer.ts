import {
	ICreatedIssueRelation,
	ID,
	IIssueRelation,
	IssueRelationTypeEnum,
	ITask,
	ITaskLinkedIssue,
	ITaskLinkedIssueCreateInput,
	TaskRelatedIssuesRelationEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import { baseGetItemsWhereQuery } from '../../query-params.serializers';

const issueRelationToTypeMap = {
	[TaskRelatedIssuesRelationEnum.IS_BLOCKED_BY]:
		IssueRelationTypeEnum.BLOCKED_BY,
	[TaskRelatedIssuesRelationEnum.BLOCKS]: IssueRelationTypeEnum.BLOCKING,
	[TaskRelatedIssuesRelationEnum.DUPLICATES]: IssueRelationTypeEnum.DUPLICATE,
	[TaskRelatedIssuesRelationEnum.RELATES_TO]: IssueRelationTypeEnum.RELATES_TO
};

export function getIssueRelationType(
	relation: TaskRelatedIssuesRelationEnum
): IssueRelationTypeEnum | undefined {
	return issueRelationToTypeMap[relation];
}

export function getTaskRelatedIssueRelation(
	issueRelationType: IssueRelationTypeEnum
): TaskRelatedIssuesRelationEnum | undefined {
	const reverseMap = {
		[IssueRelationTypeEnum.BLOCKED_BY]:
			TaskRelatedIssuesRelationEnum.IS_BLOCKED_BY,
		[IssueRelationTypeEnum.BLOCKING]: TaskRelatedIssuesRelationEnum.BLOCKS,
		[IssueRelationTypeEnum.DUPLICATE]:
			TaskRelatedIssuesRelationEnum.DUPLICATES,
		[IssueRelationTypeEnum.RELATES_TO]:
			TaskRelatedIssuesRelationEnum.RELATES_TO
	};

	return reverseMap[issueRelationType];
}

export function createIssueRelationInputTranformer(
	relation_type: IssueRelationTypeEnum,
	taskToId: ID,
	taskFromId: ID
): ITaskLinkedIssueCreateInput {
	return {
		action: getTaskRelatedIssueRelation(relation_type),
		taskFromId,
		taskToId
	};
}

export function createdIssueRelationTranformer(
	linkedIssue: ITaskLinkedIssue,
	issue: ITask
): ICreatedIssueRelation {
	return {
		id: linkedIssue.taskFromId,
		relation_type: getIssueRelationType(linkedIssue.action),
		name: issue?.title,
		sequence_id: 0, // TODO : Search usecase
		project_id: issue?.projectId // Best to be consistent
	};
}

const taskLinkedIssueRelations = ['taskTo', 'taskFrom'];

export const getTaskRelationQuery = (): Record<string, string> => {
	// Tenant and Organization based query
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery()
	};

	// Add relations
	taskLinkedIssueRelations.forEach((relation, i) => {
		query[`relations[${i}]`] = relation;
	});

	return query;
};

export const findByOptionsQuery = (
	options: Partial<ITaskLinkedIssue>,
	withDeleted?: boolean
) => {
	// Base queries
	const query: Record<string, any> = {
		...baseGetItemsWhereQuery(),
		withDeleted
	};
	const { action, taskFromId, taskToId } = options;

	if (action) {
		query['where[action]'] = action;
	}

	if (taskFromId) {
		query['where[taskFromId]'] = taskFromId;
	}

	if (taskToId) {
		query['where[taskToId]'] = taskToId;
	}

	// Add relations
	taskLinkedIssueRelations.forEach((relation, i) => {
		query[`relations[${i}]`] = relation;
	});

	return query;
};

export function issueRelationTransformer(
	linkedIssues: ITaskLinkedIssue[]
): IIssueRelation[] {
	return linkedIssues?.map((linkedIssue) => {
		return {
			id: linkedIssue.taskFrom.id,
			relation_type: getIssueRelationType(linkedIssue.action),
			issue_id: linkedIssue.taskFrom.id,
			related_issue_id: linkedIssue.taskTo.id,
			name: linkedIssue.taskFrom.title,
			sequence_id: linkedIssue.taskFrom.number,
			project_id: linkedIssue.taskFrom.projectId, // Should be consistent
			workspace_id: linkedIssue.organizationId,
			created_at: linkedIssue.createdAt,
			updated_at: linkedIssue.updatedAt,
			created_by_id: null, // To update
			updated_by_id: null // To update
		};
	});
}
