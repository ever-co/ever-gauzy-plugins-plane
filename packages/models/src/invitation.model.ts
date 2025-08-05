import { ID, IUser } from './imports';
import { IWorkspaceInfo } from './base.model';

export interface ICreateWorkspaceInvitationInput {
	email: string;
	role: number;
}

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

export interface IInvitationAcceptResponse {
	user: IUser;
	token: string;
	refresh_token: string;
}
