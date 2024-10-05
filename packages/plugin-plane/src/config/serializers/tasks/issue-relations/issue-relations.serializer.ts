import {
	IIssueRelation,
	IssueRelationTypeEnum,
	ITaskLinkedIssue,
	TaskRelatedIssuesRelationEnum,
} from '@plane-plugin/models';

const issueRelationMap = {
	[TaskRelatedIssuesRelationEnum.IS_BLOCKED_BY]:
		IssueRelationTypeEnum.BLOCKED_BY,
	[TaskRelatedIssuesRelationEnum.BLOCKS]: IssueRelationTypeEnum.BLOCKING,
	[TaskRelatedIssuesRelationEnum.DUPLICATES]: IssueRelationTypeEnum.DUPLICATE,
	[TaskRelatedIssuesRelationEnum.RELATES_TO]:
		IssueRelationTypeEnum.RELATES_TO,
};

export function getIssueRelationType(
	relation: TaskRelatedIssuesRelationEnum,
): IssueRelationTypeEnum | undefined {
	return issueRelationMap[relation];
}

export function getTaskRelatedIssueRelation(
	issueRelationType: IssueRelationTypeEnum,
): TaskRelatedIssuesRelationEnum | undefined {
	const reverseMap = {
		[IssueRelationTypeEnum.BLOCKED_BY]:
			TaskRelatedIssuesRelationEnum.IS_BLOCKED_BY,
		[IssueRelationTypeEnum.BLOCKING]: TaskRelatedIssuesRelationEnum.BLOCKS,
		[IssueRelationTypeEnum.DUPLICATE]:
			TaskRelatedIssuesRelationEnum.DUPLICATES,
		[IssueRelationTypeEnum.RELATES_TO]:
			TaskRelatedIssuesRelationEnum.RELATES_TO,
	};

	return reverseMap[issueRelationType];
}

export function issueRelationTransformer(
	linkedIssue: ITaskLinkedIssue,
): IIssueRelation {
	return {
		id: linkedIssue.id,
		relation_type: getIssueRelationType(linkedIssue.action),
		issue_id: linkedIssue.taskFrom.id,
		related_issue_id: linkedIssue.taskTo.id,
		project_id: linkedIssue.taskFrom.projectId, // Should be consistent
		workspace_id: linkedIssue.tenantId,
		created_at: linkedIssue.createdAt,
		updated_at: linkedIssue.updatedAt,
		created_by_id: null, // To update
		updated_by_id: null, // To update
	};
}
