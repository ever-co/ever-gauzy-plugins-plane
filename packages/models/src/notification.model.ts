import { IIssue } from 'issue.model';
import { ID } from './imports';
import { IMemberInfo } from './user.model';
import { IIssueActivity } from 'activity.model';

export interface INotification {
	id?: ID;
	triggered_by_details?: IMemberInfo;
	is_inbox_issue?: boolean;
	is_intake_issue?: boolean;
	is_mentioned_notification?: boolean;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
	data?: {
		issue?: IIssue;
		issue_activity?: IIssueActivity;
	};
	entity_identifier?: ID;
	entity_name?: string;
	title?: string;
	message?: string;
	message_html?: string;
	message_stripped?: string;
	sender?: string;
	read_at?: Date;
	snoozed_till?: Date;
	archived_at?: Date;
	created_by?: Date;
	updated_by?: Date;
	workspace?: ID;
	project?: ID;
	triggered_by?: Date;
	receiver?: Date;
}
