import { ID } from './imports';

export interface IDecodedToken {
	id: ID;
	tenantId: ID;
	employeeId: ID;
	role: string;
	permissions: string[];
	iat: number;
	email?: string;
	code?: string;
}

export interface IUserRegisterInput {
	csrfmiddlewaretoken?: string;
	email: string;
	next_path?: string;
	password: string;
	confirm_password: string;
}

export interface IMagicGenerateResponse {
	key: string;
}
