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
