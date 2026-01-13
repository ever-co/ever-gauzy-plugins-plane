import { ID } from './imports';
import { IProjectLogoProps } from './project.model';

/**
 * View props for project deploy boards
 */
export interface IProjectDeployBoardsViewProps {
	list: boolean;
	kanban: boolean;
	calendar?: boolean;
	gantt?: boolean;
	spreadsheet?: boolean;
}

/**
 * The input for creating a project deploy boards
 */
export interface IProjectDeployBoardsCreateInput {
	is_comments_enabled: boolean;
	is_reactions_enabled: boolean;
	is_votes_enabled: boolean;
	is_activity_enabled?: boolean;
	is_disabled?: boolean;
	view_props: IProjectDeployBoardsViewProps;
}

/**
 * Project details for the deploy board response
 */
export interface IProjectDeployBoardProjectDetails {
	id: ID;
	identifier: string;
	name: string;
	cover_image?: string;
	cover_image_url?: string;
	logo_props?: IProjectLogoProps;
	description?: string;
}

/**
 * Workspace details for the deploy board response
 */
export interface IProjectDeployBoardWorkspaceDetails {
	id: ID;
	name: string;
	slug: string;
	logo_url?: string;
}

/**
 * The response format for a project deploy board (matches Plane's format)
 */
export interface IProjectDeployBoardResponse extends IProjectDeployBoardsCreateInput {
	id: ID;
	deleted_at: Date | null;
	project_details: IProjectDeployBoardProjectDetails;
	workspace_detail: IProjectDeployBoardWorkspaceDetails;
	created_at: Date;
	updated_at: Date;
	entity_identifier: ID;
	entity_name: string;
	anchor: string;
	created_by?: ID;
	updated_by?: ID;
	workspace: ID;
	project: ID;
	intake: ID | null;
}
