import { ActorTypeEnum, ID } from './imports';
import { IWorkspaceInfo } from './base.model';
import { IMemberInfo } from './user.model';
import { IIssue, IIssueReaction } from './issue.model';
import { IProject } from './project.model';

export interface IIssueComment {
	id?: ID;
	actor_detail: IMemberInfo;
	issue_detail: IIssue;
	project_detail: IProject;
	workspace_detail: IWorkspaceInfo;
	comment_reactions: IIssueReaction[];
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date | null;
	comment_stripped?: string;
	comment_json?: Record<string, string>;
	comment_html?: string;
	attachments?: any;
	access?: any;
	external_source?: any;
	external_id?: any;
	created_by?: ID;
	updated_by?: ID;
	project?: ID;
	workspace?: ID;
	issue?: ID;
	actor?: ID;
}

export interface ICreateCommentInput {
	actorType?: ActorTypeEnum;
	comment_html: string;
}
