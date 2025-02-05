import { ID } from './imports';
import { IIssueActivity } from './activity.model';
import { IIssue } from './issue.model';
import { IMemberInfo } from './user.model';

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
	created_by?: ID;
	updated_by?: ID;
	workspace?: ID;
	project?: ID;
	triggered_by?: ID;
	receiver?: ID;
}

export interface IUnreadNotificationResponse {
	total_unread_notifications_count?: number;
	mention_unread_notifications_count?: number;
}

export interface INotificationResponse {
	grouped_by?: string;
	sub_grouped_by?: string;
	total_count?: number;
	next_cursor?: string;
	prev_cursor?: string;
	next_page_results?: boolean;
	prev_page_results?: boolean;
	count?: number;
	total_pages?: number;
	total_results?: number;
	extra_stats?: any;
	results?: INotification[];
}
