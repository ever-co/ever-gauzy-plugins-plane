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
	state_name?: string;
	state_group?: string;
	sort_order?: number;
	completed_at?: Date;
	estimate_point?: ID;
	priority?: TaskPriorityEnum;
	start_date?: Date;
	target_date?: Date;
	sequence_id?: number;
	project_id?: ID;
	project__identifier?: string;
	identifier?: string;
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
	is_subscribed?: boolean;
	archived_at?: Date;
	state__group?: string;
	type_id?: ID;
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
	workspace__slug?: string;
}

export interface IIssueCreateInput extends Omit<IIssue, 'id' | 'parent'> {}

export type IIssueUpdateInput = IIssue;

export interface IIssueFindInput {
	module?: string;
	cycle?: string;
	group_by?: IssueGroupByEnum;
	sub_group_by?: IssueGroupByEnum;
	order_by?: IssueOrderByField;
	sub_issue?: boolean;
	creatorId?: ID;
	created_by?: string;
	assignees?: string;
	priority?: string;
	state?: string;
	type?: IssueFindByTypeEnum;
	start_date?: string;
	target_date?: string;
	subscriber?: string;
	mentions?: string;
	labels?: string;
	module_ids?: ID[];
}

export enum IssueFindByTypeEnum {
	ACTIVE = 'active',
	BACKLOG = 'backlog'
}

export enum IssueGroupByEnum {
	ASSIGNEE_ID = 'assignees__id',
	CREATED_BY = 'created_by',
	CYCLE_ID = 'cycle_id',
	LABEL_ID = 'labels__id',
	MODULE_ID = 'issue_module__module_id',
	PRIORITY = 'priority',
	PROJECT_ID = 'project_id',
	STATE = 'state_id',
	STATE_GROUP = 'state__group',
	TARGET_DATE = 'target_date'
}

export type IssueManyToManyGroupCriteria = 'tags' | 'members' | 'modules';

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
