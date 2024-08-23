import { ID } from './imports';

export interface IProject {
	id?: string;
	is_favorite: boolean;
	total_members: number;
	total_cycles: number;
	total_modules: number;
	total_issues?: number;
	archived_issues?: number;
	archived_sub_issues?: number;
	draft_issues?: number;
	draft_sub_issues?: number;
	sub_issues?: number;
	is_member: boolean;
	sort_order: number;
	member_role: number;
	anchor: any;
	members: {
		id: string;
		member_id: string;
		member__display_name: string;
		member__avatar: string;
	}[];
	state_id: any;
	priority: any;
	start_date: Date;
	target_date: Date;
	created_at: Date;
	updated_at: Date;
	deleted_at: any;
	name: string;
	description: string;
	description_text: any;
	description_html: any;
	network: number;
	identifier: string;
	emoji: any;
	icon_prop: any;
	module_view: true;
	cycle_view: true;
	issue_views_view: true;
	page_view: true;
	inbox_view: false;
	is_time_tracking_enabled: false;
	is_issue_type_enabled: false;
	cover_image: string;
	archive_in: 0;
	close_in: 0;
	logo_props: {
		emoji: {
			value: string;
		};
		in_use: string;
	};
	archived_at: any;
	created_by: string;
	updated_by: string;
	workspace: string;
	default_assignee: any;
	project_lead: any;
	estimate: any;
	default_state: any;
}

export interface ICreateProjectInput extends Partial<Omit<IProject, 'id'>> {}

export interface IGetProjectMembersResponse {
	id: string;
	role: number;
	member: ID;
	project: ID;
}
