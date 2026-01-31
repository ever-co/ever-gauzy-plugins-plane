import { ID } from './imports';

/**
 * Chart X-Axis properties for analytics
 */
export enum ChartXAxisProperty {
	STATES = 'STATES',
	STATE_GROUPS = 'STATE_GROUPS',
	LABELS = 'LABELS',
	ASSIGNEES = 'ASSIGNEES',
	ESTIMATE_POINTS = 'ESTIMATE_POINTS',
	CYCLES = 'CYCLES',
	MODULES = 'MODULES',
	PRIORITY = 'PRIORITY',
	START_DATE = 'START_DATE',
	TARGET_DATE = 'TARGET_DATE',
	CREATED_AT = 'CREATED_AT',
	COMPLETED_AT = 'COMPLETED_AT',
	CREATED_BY = 'CREATED_BY',
	WORK_ITEM_TYPES = 'WORK_ITEM_TYPES',
	PROJECTS = 'PROJECTS',
	EPICS = 'EPICS'
}

/**
 * Chart Y-Axis metrics for analytics
 */
export enum ChartYAxisMetric {
	WORK_ITEM_COUNT = 'WORK_ITEM_COUNT',
	ESTIMATE_POINT_COUNT = 'ESTIMATE_POINT_COUNT',
	PENDING_WORK_ITEM_COUNT = 'PENDING_WORK_ITEM_COUNT',
	COMPLETED_WORK_ITEM_COUNT = 'COMPLETED_WORK_ITEM_COUNT',
	IN_PROGRESS_WORK_ITEM_COUNT = 'IN_PROGRESS_WORK_ITEM_COUNT',
	WORK_ITEM_DUE_THIS_WEEK_COUNT = 'WORK_ITEM_DUE_THIS_WEEK_COUNT',
	WORK_ITEM_DUE_TODAY_COUNT = 'WORK_ITEM_DUE_TODAY_COUNT',
	BLOCKED_WORK_ITEM_COUNT = 'BLOCKED_WORK_ITEM_COUNT',
	EPIC_WORK_ITEM_COUNT = 'EPIC_WORK_ITEM_COUNT'
}

/**
 * Analytics type for charts and stats
 */
export enum AnalyticsType {
	PROJECTS = 'projects',
	WORK_ITEMS = 'work-items',
	CUSTOM_WORK_ITEMS = 'custom-work-items'
}

/**
 * Date filter options for analytics
 */
export enum DateFilter {
	YESTERDAY = 'yesterday',
	LAST_7_DAYS = 'last_7_days',
	LAST_30_DAYS = 'last_30_days',
	LAST_3_MONTHS = 'last_3_months',
	CUSTOM = 'custom'
}

/**
 * Analytics tabs base type
 */
export type TAnalyticsTabsBase = 'overview' | 'work-items';

/**
 * Analytics graphs base type
 */
export type TAnalyticsGraphsBase = 'projects' | 'work-items' | 'custom-work-items';

/**
 * Work item count stats
 */
export interface IWorkItemCount {
	count: number;
}

/**
 * Response for /advance-analytics endpoint
 */
export interface IAdvanceAnalyticsResponse {
	total_work_items: IWorkItemCount;
	started_work_items: IWorkItemCount;
	backlog_work_items: IWorkItemCount;
	un_started_work_items: IWorkItemCount;
	completed_work_items: IWorkItemCount;
}

/**
 * Row item for work items stats table (per assignee)
 */
export interface IWorkItemInsightRow {
	display_name?: string;
	assignee_id?: ID;
	avatar_url?: string;
	cancelled_work_items: number;
	completed_work_items: number;
	backlog_work_items: number;
	un_started_work_items: number;
	started_work_items: number;
	project_id?: ID;
	project__name?: string;
}

/**
 * Chart data item for analytics charts
 */
export interface IChartDataItem {
	key: string;
	name: string;
	count: number;
	[groupKey: string]: string | number;
}

/**
 * Response for /advance-analytics-charts endpoint
 */
export interface IAdvanceAnalyticsChartResponse {
	data: IChartDataItem[];
	schema: Record<string, string>;
}

/**
 * Query parameters for advance analytics endpoints
 */
export interface IAdvanceAnalyticsQuery {
	cycle_id?: ID;
	module_id?: ID;
	date_filter?: DateFilter;
}

/**
 * Query parameters for advance analytics stats endpoint
 */
export interface IAdvanceAnalyticsStatsQuery extends IAdvanceAnalyticsQuery {
	type: AnalyticsType;
	project_ids?: string;
}

/**
 * Query parameters for advance analytics charts endpoint
 */
export interface IAdvanceAnalyticsChartsQuery extends IAdvanceAnalyticsQuery {
	type: AnalyticsType;
	x_axis?: ChartXAxisProperty;
	y_axis?: ChartYAxisMetric;
	group_by?: ChartXAxisProperty;
	project_ids?: string;
}
