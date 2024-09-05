import { ID } from './imports';

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
