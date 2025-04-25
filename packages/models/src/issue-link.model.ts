import { ID, JsonData } from './imports';
import { IMemberInfo } from './user.model';

export interface IIssueLink {
	id?: ID;
	created_by_detail?: IMemberInfo;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
	title: string;
	url: string;
	metadata: JsonData;
	created_by?: ID;
	created_by_id?: ID;
	updated_by?: ID;
	project?: ID;
	workspace?: ID;
	issue?: ID;
	issue_id?: ID;
	owner?: ID;
}

export interface ICreateIssueLink {
	title: string;
	url: string;
}
