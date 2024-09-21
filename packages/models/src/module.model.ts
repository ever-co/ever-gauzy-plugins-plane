export interface IModule {
	id: string;
	workspace_id?: string;
	project_id?: string;
	name: string;
	description?: string;
	description_text?: string | null;
	description_html?: string | null;
	start_date?: Date | null;
	target_date?: Date | null;
	status?: string;
	lead_id?: string;
	view_props?: any;
	sort_order?: number;
	external_source?: any;
	external_id?: any;
	logo_props?: any;
	created_at?: Date;
	updated_at?: Date;
	is_favorite?: boolean;
	completed_issues?: number;
	cancelled_issues?: number;
	started_issues?: number;
	unstarted_issues?: number;
	backlog_issues?: number;
	total_issues?: number;
	completed_estimate_points?: number;
	total_estimate_points?: number;
	member_ids?: string[];
}

export interface ICreateModuleInput {
	name: string;
	description?: string;
	start_date?: Date;
	target_date?: Date;
	status?: string;
	lead_id?: string;
	member_ids?: string[];
	project_id: string;
}
