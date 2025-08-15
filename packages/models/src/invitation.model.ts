import { ID, IUser } from './imports';
import { IWorkspaceInfo } from './base.model';

/**
 * Represents an input for creating a workspace invitation.
 *
 * @interface ICreateWorkspaceInvitationInput
 * @property {string} email - The email address of the user being invited.
 * @property {number} role - The role assigned to the user in the workspace.
 */
export interface ICreateWorkspaceInvitationInput {
	email: string;
	role: number;
}

/**
 * Represents an invitation to a workspace.
 *
 * @interface IInvitation
 */
export interface IInvitation {
	id: ID;
	deleted_at?: Date;
	workspace?: IWorkspaceInfo;
	invite_link?: string;
	created_at?: Date;
	updated_at?: Date;
	email?: string;
	accepted?: boolean;
	token?: string;
	message?: string;
	responded_at?: Date;
	role?: number;
	created_by?: ID;
	updated_by?: ID;
}

/**
 * Represents the response from accepting an invitation to a workspace.
 *
 * @interface IInvitationAcceptResponse
 * @property {IUser} user - The user who accepted the invitation.
 * @property {string} token - The token used to authenticate the user.
 * @property {string} refresh_token - The refresh token used to refresh the user's authentication.
 */
export interface IInvitationAcceptResponse {
	user: IUser;
	token: string;
	refresh_token: string;
}

/**
 * Represents the input for accepting an invitation to a workspace.
 *
 * @interface IInvitationAcceptInput
 * @property {string} token - The token used to authenticate the user.
 * @property {string} email - The email address of the user accepting the invitation.
 * @property {boolean} accepted - Whether the invitation was accepted.
 */
export interface IInvitationAcceptInput {
	token: string;
	email: string;
	accepted?: boolean;
}
