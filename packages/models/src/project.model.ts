import { ID } from './imports';

export interface IProject {
	id?: string;
	is_favorite?: boolean;
	total_members?: number;
	total_cycles?: number;
	total_modules?: number;
	total_issues?: number;
	archived_issues?: number;
	archived_sub_issues?: number;
	draft_issues?: number;
	draft_sub_issues?: number;
	sub_issues?: number;
	is_member?: boolean;
	sort_order?: number;
	member_role?: number;
	anchor?: any;
	members?: {
		id: string;
		member_id: string;
		member__display_name: string;
		member__avatar: string;
	}[];
	state_id?: any;
	priority?: any;
	start_date?: Date;
	target_date?: Date;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: any;
	name?: string;
	description?: string;
	description_text?: any;
	description_html?: any;
	network?: number;
	identifier?: string;
	emoji?: any;
	icon_prop?: any;
	module_view?: true;
	cycle_view?: true;
	issue_views_view?: true;
	page_view?: true;
	inbox_view?: false;
	is_time_tracking_enabled?: false;
	is_issue_type_enabled?: false;
	cover_image?: string;
	archive_in?: number;
	close_in?: number;
	logo_props?: {
		emoji: {
			value: string;
		};
		in_use: string;
	};
	archived_at?: Date;
	created_by?: ID;
	updated_by?: ID;
	workspace?: ID;
	default_assignee?: ID;
	project_lead?: ID;
	estimate?: any;
	default_state?: any;
}

export interface ICreateProjectInput extends Partial<Omit<IProject, 'id'>> {}

export type IUpdateProjectInput = IProject;

export interface IGetProjectMembersResponse {
	id: string;
	role: number;
	member: ID;
	project: ID;
}

export interface IProjectIdentifierResponse {
	exists: number;
	identifiers: IProjectIdentifier[];
}

export interface IProjectIdentifier {
	id?: number;
	name?: string;
	project?: ID;
}
