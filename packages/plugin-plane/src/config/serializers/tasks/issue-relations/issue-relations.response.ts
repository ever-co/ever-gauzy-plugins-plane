import { TaskRelatedIssuesRelationEnum } from '@plane-plugin/models';

export enum IssueRelationTypeEnum {
	BLOCKING = 'blocking',
	BLOCKED_BY = 'blocked_by',
	DUPLICATE = 'duplicate',
	RELATES_TO = 'relates_to',
}

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
