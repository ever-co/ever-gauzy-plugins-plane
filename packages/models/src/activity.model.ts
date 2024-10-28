import { ActionTypeEnum, BaseEntityEnum, ID } from './imports';
import { IIssueComment } from './comment.model';

export interface IIssueActivity extends IIssueComment {
	verb?: string;
	field?: string;
	old_value?: string;
	new_value?: string;
	comment?: string;
	old_identifier?: ID;
	new_identifier?: ID;
	epoch?: number;
	issue_comment?: ID;
}

export interface IIssueActivityFindInput {
	entity?: BaseEntityEnum;
	entityId?: ID;
	action?: ActionTypeEnum;
}
