import { IIssue } from './issue.model';
import { ID } from './imports';

export enum IssueRelationTypeEnum {
	BLOCKING = 'blocking',
	BLOCKED_BY = 'blocked_by',
	DUPLICATE = 'duplicate',
	RELATES_TO = 'relates_to'
}

export interface IIssueRelation {
	created_at?: Date;
	updated_at?: Date;
	id?: ID;
	relation_type?: string;
	created_by_id?: ID;
	issue_id?: ID;
	project_id?: ID;
	related_issue_id?: ID;
	updated_by_id?: ID;
	workspace_id?: ID;
}

export interface IIssueRelationResponse {
	[IssueRelationTypeEnum.BLOCKED_BY]: IIssue[];
	[IssueRelationTypeEnum.BLOCKING]: IIssue[];
	[IssueRelationTypeEnum.DUPLICATE]: IIssue[];
	[IssueRelationTypeEnum.RELATES_TO]: IIssue[];
}

export interface IParentableIssuesQueruParams {
	search: string;
	parent: boolean;
	issue_id: ID;
	workspace_search: boolean;
}
