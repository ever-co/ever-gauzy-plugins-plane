import { BaseEntityEnum, EmployeeSettingTypeEnum, ID } from './imports';

export interface IWorkspaceInfo {
	name?: string;
	slug?: string;
	id?: ID;
	logo_url?: string;
}

export interface IDefaultProps extends IViewProps {}

export interface IViewProps {
	filters?: IViewPropsFilters;
	display_filters?: IViewPropsDisplayFilters;
	display_properties?: IDisplayProperties;
}

export interface IDefaultIssueProps {
	created?: boolean;
	assigned?: boolean;
	all_issues?: boolean;
	subscribed?: boolean;
}

export interface IViewPropsFilters {
	labels?: ID[];
	project?: ID[];
	priority?: string[];
	assignees?: ID[];
	cycle?: ID[];
	module?: ID[];
	created_by?: ID[];
	start_date?: string[];
	state_group?: string[];
	target_date?: string[];
	subscriber?: string[];
	state?: string[];
	state_in?: ID[];
}

export interface IViewPropsDisplayFilters {
	type?: any;
	layout?: string | null;
	calendar?: {
		layout?: string;
		show_weekends?: boolean;
	};
	group_by?: string | null;
	order_by?: string | null;
	sub_issue?: boolean;
	sub_group_by?: string;
	show_empty_groups?: boolean;
	calendar_date_range?: string;
}

export interface IDisplayProperties {
	key?: boolean;
	link?: boolean;
	cycle?: boolean;
	state?: boolean;
	labels?: boolean;
	modules?: boolean;
	assignee?: boolean;
	due_date?: boolean;
	estimate?: boolean;
	priority?: boolean;
	created_on?: boolean;
	issue_type?: boolean;
	start_date?: boolean;
	updated_on?: boolean;
	sub_issue_count?: boolean;
	attachment_count?: boolean;
}

export interface IUpdateUserPropertiesInput {
	display_filters?: IViewPropsDisplayFilters;
	filters?: IViewPropsFilters;
	display_properties?: IDisplayProperties;
}

export enum IssueOrderByField {
	DESC_CREATED_AT = '-created_at',
	DESC_UPDATED_AT = '-updated_at',
	ASC_CREATED_AT = 'created_at',
	ASC_UPDATED_AT = 'updated_at',
	START_DATE = 'start_date',
	DESC_PRIORITY = '-priority',
	MANUAL = 'sort_order'
}

export interface IFindUserPropertiesInput {
	employeeId: ID;
	entityId?: ID;
	entity?: BaseEntityEnum;
	settingType?: EmployeeSettingTypeEnum;
}
