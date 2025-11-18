import { ID } from './imports';
import { IViewProps } from './base.model';

export interface IView extends IViewProps {
	id?: ID;
	created_at?: Date;
	is_favorite?: boolean;
	updated_at?: Date;
	deleted_at?: Date;
	name?: string;
	description?: string;
	query?: ITaskViewQuery;
	access?: number;
	sort_order?: number;
	logo_props?: any;
	is_locked?: boolean;
	created_by?: ID;
	updated_by?: ID;
	workspace?: ID;
	project?: ID;
	owned_by?: ID;
}

export interface ITaskViewQuery {
	state__in?: ID[];
	labels__in?: ID[];
	start_date?: string[];
	project__in?: ID[];
	target_date?: string[];
	priority__in?: string[];
	assignees__in?: ID[];
	issue_mention__mention__id__in?: ID[];
	created_by__in?: ID[];
	state__group__in?: string[];
	issue_module__module_id__in?: ID[];
	issue_cycle__cycle_id__in?: ID[];
	cycle_id__in?: ID[];
	module_id__in?: ID[];
	state_in?: ID[];
	state_id__in?: ID[];
	state_group__in?: ID[];
	assignee_id__in?: ID[];
	mention_id__in?: ID[];
	label_id__in?: ID[];
	start_date__exact?: string[];
	target_date__exact?: string[];
	start_date__range?: string[];
}

export interface ICreateViewInput extends IViewProps {
	name: string;
	description?: string;
	access?: number;
}

export interface IUpdateViewInput extends Partial<ICreateViewInput> {}
