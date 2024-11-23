import { ID, IOrganizationSprint, TaskPriorityEnum } from './imports';
import { IssueOrderByField } from './base.model';
import { IReactionData } from './reaction.model';
import { IIssueLink } from './issue-link.model';
import { ICycle } from './cycle.model';
import { IIssueRelation } from './issue-relation.model';

export interface IIssue {
	id?: ID;
	name?: string;
	description_html?: string;
	description?: any;
	state?: string;
	state_id?: ID;
	sort_order?: number;
	completed_at?: Date;
	estimate_point?: ID;
	priority?: TaskPriorityEnum;
	start_date?: Date;
	target_date?: Date;
	sequence_id?: number;
	project_id?: ID;
	parent_id?: ID;
	parent?: {
		id?: ID;
		sequence_id?: number;
		project_id: ID;
		type_id: ID;
	};
	created_at?: Date;
	updated_at?: Date;
	created_by?: string;
	updated_by?: string;
	is_draft?: boolean;
	archived_at?: Date;
	state__group?: string;
	type_id?: string;
	cycle_id?: ID;
	cycle?: ICycle | IOrganizationSprint;
	link_count?: number;
	attachment_count?: number;
	sub_issues_count?: number;
	assignee_ids?: ID[];
	label_ids?: ID[];
	module_ids?: ID[];
	modules?: ID[];
	removed_modules?: ID[];
	issue_reactions?: IReactionData[];
	issue_relation?: IIssueRelation[];
	issue_link?: IIssueLink[];
	sub_issue_ids?: ID[];
	issue_attachment?: [];
}

export interface IIssueCreateInput extends Omit<IIssue, 'id' | 'parent'> {}

export type IIssueUpdateInput = IIssue;

export interface IIssueFindInput {
	module?: ID;
	group_by?: IssueGroupBy;
	order_by?: IssueOrderByField;
	creatorId?: ID;
	created_by?: ID;
	assignees?: ID;
}

export enum IssueGroupBy {
	STATE = 'state_id',
	TARGET_DATE = 'target_date',
	STATE_GROUP = 'state__group',
	PRIORITY = 'priority',
	PROJECT_ID = 'project_id',
	LABEL_ID = 'labels__id'
}

export enum IssueActivityTypeEnum {
	COMMENT = 'issue-comment',
	PROPERTY = 'issue-property'
}

export interface ISubIssueResponse {
	sub_issues: IIssue[];
	state_distribution: ICompletedIssuesDistribution;
}

export interface ICompletedIssuesDistribution {
	backlog: ID[];
	completed: ID[];
	unstarted: ID[];
	started: ID[];
}
