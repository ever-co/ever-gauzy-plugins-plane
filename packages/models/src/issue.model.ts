import { ID, TaskPriorityEnum } from './imports';

export interface IIssue {
	id?: ID;
	name?: string;
	description_html?: string;
	description?: any;
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
	link_count?: number;
	attachment_count?: number;
	sub_issues_count?: number;
	assignee_ids?: ID[];
	label_ids?: ID[];
	module_ids?: ID[];
	issue_reactions?: [];
	issue_attachment?: [];
}

export interface IIssueCreateInput extends Omit<IIssue, 'id' | 'parent'> {}

export type IIssueUpdateInput = IIssue;

export interface IIssueReaction {
	id?: ID;
	reaction: string;
	comment: ID;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date | null;
	created_by?: ID;
	updated_by?: ID;
	project?: ID;
	workspace?: ID;
	actor?: ID;
}
