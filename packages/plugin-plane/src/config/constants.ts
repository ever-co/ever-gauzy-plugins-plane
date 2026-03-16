import { IWidget } from '@ever-gauzy/plugin-integration-plane-models';
import { PlaneConfigRegistry } from '../plane-config.registry';

export const CLIENT_BASE_URL = () => PlaneConfigRegistry.clientBaseUrl;

export const CLIENT_SPACE_URL = () => PlaneConfigRegistry.clientSpaceUrl;

export const CLIENT_ADMIN_URL = () => PlaneConfigRegistry.clientAdminUrl;

export const CLIENT_URLS = () => PlaneConfigRegistry.clientUrls;

export const MAX_TOKEN_COOKIE_SIZE = 3999;

export const EXTERNAL_BASE_API_URL = () => PlaneConfigRegistry.externalBaseApiUrl;

/**
 * The default view props for the member
 */
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
	rich_filters: {},
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

/**
 * The default dashboard widgets
 */
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

/**
 * The default sidebar preferences
 */
export const DEFAULT_SIDBAR_PREFERENCES = {
	views: {
		is_pinned: false,
		sort_order: 65535.0
	},
	active_cycles: {
		is_pinned: false,
		sort_order: 75535.0
	},
	analytics: {
		is_pinned: false,
		sort_order: 85535.0
	},
	drafts: {
		is_pinned: false,
		sort_order: 95535.0
	},
	your_work: {
		is_pinned: false,
		sort_order: 105535.0
	},
	archives: {
		is_pinned: false,
		sort_order: 115535.0
	},
	team_spaces: {
		is_pinned: false,
		sort_order: 125535.0
	},
	initiatives: {
		is_pinned: false,
		sort_order: 135535.0
	},
	customers: {
		is_pinned: false,
		sort_order: 145535.0
	},
	dashboards: {
		is_pinned: false,
		sort_order: 155535.0
	}
};

/**
 * The default magic generate prefix
 */
export const DEFAULT_MAGIC_GENERATE_PREFIX = 'magic_';

/**
 * The default alpha numeric code length
 */
export const ALPHA_NUMERIC_CODE_LENGTH = 6;

/**
 * The default project deploy boards properties
 */
export const DEFAULT_PROJECT_DEPLOY_BOARDS_PROPERTIES = {
	entity_identifier: null,
	entity_name: '',
	is_comments_enabled: false,
	is_reactions_enabled: false,
	is_votes_enabled: false,
	view_props: null,
	is_activity_enabled: false,
	is_disabled: false,
	created_by: null,
	updated_by: null,
	intake: null
};
