import { ID, TaskPriorityEnum } from './imports';
import { IProjectLogoProps } from './project.model';

/**
 * Interface for a project recent visit data.
 */
export interface IProjectRecentVisit {
	id: ID;
	name: string;
	logo_props: IProjectLogoProps;
	project_members: ID[];
	identifier: string;
}

/**
 * Interface for an issue recent visit data.
 */
export interface IIssueRecentVisit {
	id: ID;
	name: string;
	state: ID;
	priority: TaskPriorityEnum;
	assignees: ID[];
	type: any;
	sequence_id: number;
	project_id: ID;
	project_identifier: string;
	is_epic: boolean;
}

/**
 * Interface for a recent visit data.
 */
export interface IRecentVisit {
	id: ID;
	entity_name: string;
	entity_identifier: ID;
	entity_data: IProjectRecentVisit | IIssueRecentVisit;
	visited_at: Date;
}
