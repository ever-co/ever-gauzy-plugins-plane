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

export interface IUserStatsResponse {
	state_distribution: IUserStateDistribution[];
	priority_distribution: IUserPriorityDistribution[];
	created_issues: number;
	assigned_issues: number;
	completed_issues: number;
	pending_issues: number;
	subscribed_issues: number;
	present_cycles: any[];
	upcoming_cycles: any[];
}

export interface IUserStateDistribution {
	state_group: string;
	state_count: number;
}

export interface IUserPriorityDistribution {
	priority: string;
	priority_count: number;
	priority_order: number;
}

export interface IUserProjectsDataResponse {
	project_data: IUserProjectData[];
	user_data: IUserProfileData;
}

export interface IUserProjectData {
	id: ID;
	logo_props: {
		emoji: {
			url: string;
			value: string;
		};
		in_use: string;
	};
	created_issues: number;
	assigned_issues: number;
	completed_issues: number;
	pending_issues: number;
}

export interface IUserProfileData {
	email: string;
	first_name?: string;
	last_name?: string;
	avatar_url?: string;
	cover_image_url?: string;
	date_joined?: Date;
	user_timezone?: string;
	display_name?: string;
}
