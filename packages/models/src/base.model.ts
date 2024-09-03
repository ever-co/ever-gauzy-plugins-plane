import { ID } from './imports';

export interface IWorkspaceInfo {
	name?: string;
	slug?: string;
	id?: ID;
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
	state: any;
	labels: any;
	priority: any;
	assignees: any;
	created_by: any;
	start_date: any;
	subscriber: any;
	state_group: any;
	target_date: any;
}

export interface IViewPropsDisplayFilters {
	type?: any;
	layout?: string | null;
	group_by: string | null;
	order_by?: string | null;
	sub_issue?: boolean;
	show_empty_groups?: boolean;
	calendar_date_range?: string;
}

export interface IDisplayProperties {
	key: boolean;
	link: boolean;
	state: boolean;
	labels: boolean;
	assignee: boolean;
	due_date: boolean;
	estimate: boolean;
	priority: boolean;
	created_on: boolean;
	start_date: boolean;
	updated_on: boolean;
	sub_issue_count: boolean;
	attachment_count: boolean;
}
