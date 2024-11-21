import { ID } from './imports';

export interface IRecentCollaborator {
	active_issue_count: number;
	user_id: ID;
}

export enum DashboardWigetQueryEnum {
	COLLABORATORS = 'recent_collaborators',
	OVERVIEW = 'overview_stats',
	ASSIGNED_ISSUES = 'assigned_issues',
	CREATED_ISSUES = 'created_issues',
	ISSUES_BY_STATE = 'issues_by_state_groups',
	ISSUES_BY_PRIORITY = 'issues_by_priority',
	RECENT_ACTIVITY = 'recent_activity',
	RECENT_PROJECTS = 'recent_projects'
}

export enum DashboardIssueTypeEnum {
	PENDING = 'pending',
	COMPLETED = 'completed',
	OVERDUE = 'overdue',
	UPCOMING = 'upcoming'
}

export interface UserStatsResponse {
	state_distribution: UserStateDistribution[];
	priority_distribution: UserPriorityDistribution[];
	created_issues: number;
	assigned_issues: number;
	completed_issues: number;
	pending_issues: number;
	subscribed_issues: number;
	present_cycles: any[];
	upcoming_cycles: any[];
}

export interface UserStateDistribution {
	state_group: string;
	state_count: number;
}

export interface UserPriorityDistribution {
	priority: string;
	priority_count: number;
	priority_order: number;
}
