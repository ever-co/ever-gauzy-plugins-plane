import { IWidget } from '@plane-plugin/models';

export const CLIENT_BASE_URL =
	process.env.CLIENT_BASE_URL ?? 'http://localhost';

export const EXTERNAL_API_MODE = () => process.env.EXECUTION_MODE;

// External API base URL
export const EXTERNAL_BASE_API_URL = () =>
	EXTERNAL_API_MODE() === 'develop'
		? process.env.EXTERNAL_BASE_LOCAL_API_URL
		: process.env.EXTERNAL_BASE_API_URL;

export const MEMBER_DEFAULT_VIEW_PROPS = {
	filters: {
		state: null,
		labels: null,
		priority: null,
		assignees: null,
		created_by: null,
		start_date: null,
		subscriber: null,
		state_group: null,
		target_date: null
	},
	display_filters: {
		type: null,
		layout: 'kanban',
		calendar: {
			layout: 'month',
			show_weekends: false
		},
		group_by: 'state',
		order_by: '-created_at',
		sub_issue: true,
		sub_group_by: null,
		show_empty_groups: true
	},
	display_properties: {
		key: true,
		link: true,
		state: true,
		labels: true,
		assignee: true,
		due_date: true,
		estimate: true,
		priority: true,
		created_on: true,
		start_date: true,
		updated_on: true,
		sub_issue_count: true,
		attachment_count: true
	}
};

export const DEFAULT_DASHBOARD_WIDGETS: IWidget[] = [
	{
		key: 'recent_collaborators',
		is_visible: true,
		widget_filters: {}
	},
	{
		key: 'recent_projects',
		is_visible: true,
		widget_filters: {}
	},
	{
		key: 'recent_activity',
		is_visible: true,
		widget_filters: {}
	},
	{
		key: 'issues_by_priority',
		is_visible: true,
		widget_filters: {
			duration: 'none'
		}
	},
	{
		key: 'issues_by_state_groups',
		is_visible: true,
		widget_filters: {
			duration: 'none'
		}
	},
	{
		key: 'created_issues',
		is_visible: true,
		widget_filters: {
			tab: 'pending',
			duration: 'none'
		}
	},
	{
		key: 'assigned_issues',
		is_visible: true,
		widget_filters: {
			tab: 'pending',
			duration: 'none'
		}
	},
	{
		key: 'overview_stats',
		is_visible: true,
		widget_filters: {}
	}
];
