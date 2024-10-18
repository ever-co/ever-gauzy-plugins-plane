import { ID } from './imports';

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
