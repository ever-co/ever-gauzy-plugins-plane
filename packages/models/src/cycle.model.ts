import { ID } from './imports';
import { IIssue } from './issue.model';

export interface ICycle {
	id?: ID;
	name: string;
	description?: string;
	start_date?: Date;
	end_date?: Date;
	status: CycleStatusEnum;
	version?: number;
	sort_order?: number;
	progress_snapshot?: Record<string, any>;
	is_favorite?: boolean;
	total_issues?: number;
	completed_issues?: number;
	sub_issues?: number;
	owned_by_id?: ID;
	created_by?: ID;
	workspace_id?: ID;
	project_id?: ID;
	view_props?: Record<string, any>;
	logo_props?: Record<string, any>;
	assignee_ids?: ID[];
	external_source?: any;
	external_id?: any;
}

export enum CycleStatusEnum {
	CURRENT = 'CURRENT',
	COMPLETED = 'COMPLETED',
	UPCOMING = 'UPCOMING',
	DRAFT = 'DRAFT'
}

export interface ICycleIssuesResponse {
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
	results: IIssue[];
}

export interface ICycleAnalytics {
	assignees: {
		display_name?: string;
		assignee_id?: ID;
		avatar_url?: string;
		total_issues?: number;
		completed_issues?: number;
		pending_issues?: number;
	}[];
	labels: {
		label_name?: string;
		color?: string;
		label_id?: ID;
		total_issues?: number;
		completed_issues?: number;
		pending_issues?: number;
	}[];
	completion_chart: Record<string, number>;
}

export interface ICycleProgress {
	backlog_estimate_points: number;
	unstarted_estimate_points: number;
	started_estimate_points: number;
	cancelled_estimate_points: number;
	completed_estimate_points: number;
	total_estimate_points: number;
	backlog_issues: number;
	total_issues: number;
	completed_issues: number;
	cancelled_issues: number;
	started_issues: number;
	unstarted_issues: number;
}
