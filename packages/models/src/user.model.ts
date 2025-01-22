import { ID } from './imports';
import { IDefaultIssueProps, IDefaultProps, IViewProps, IWorkspaceInfo } from './base.model';

export interface IWorkspaceUserInfo {
	id?: ID;
	member?: IMemberInfo;
	workspace?: IWorkspaceInfo;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
	role?: number;
	company_role?: string;
	view_props?: IViewProps;
	default_props?: IDefaultProps;
	issue_props?: IDefaultIssueProps;
	is_active?: boolean;
	created_by?: ID;
	updated_by?: ID;
}

export interface IUserViewProperties extends IViewProps {
	id: ID;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
	created_by?: ID;
	updated_by?: ID;
	project?: ID;
	module?: ID;
	cycle?: ID;
	workspace?: ID;
	user?: ID;
}

export interface IMemberInfo {
	id?: ID;
	first_name?: string;
	last_name?: string;
	avatar?: string;
	is_bot?: boolean;
	display_name?: string;
	email?: string;
}

export interface ICheckUserExist {
	existing: boolean;
	status: CheckUserExistEnum;
}

export interface IEmailInput {
	email: string;
}

export interface IPasswordInput {
	password?: string;
}

export enum CheckUserExistEnum {
	MAGIC_CODE = 'MAGIC_CODE',
	CREDENTIALS = 'CREDENTIAL'
}

export interface IUserProfile {
	id?: ID;
	first_name?: string;
	last_name?: string;
	display_name?: string;
	user_timezone?: string;
	avatar_url?: string;
	created_at?: Date;
	updated_at?: Date;
	theme?: {};
	is_tour_completed?: boolean;
	onboarding_step?: {
		workspace_join?: boolean;
		profile_complete?: boolean;
		workspace_create?: boolean;
		workspace_invite?: boolean;
	};
	use_case?: string;
	role?: string;
	is_onboarded?: boolean;
	last_workspace_id?: ID;
	billing_address_country?: string;
	billing_address?: null;
	has_billing_address?: boolean;
	company_name?: string;
	user?: ID;
}
