import { ID } from './imports';

export interface IDecodedToken {
	id: ID;
	tenantId: ID;
	employeeId: ID;
	role: string;
	permissions: string[];
	iat: number;
}
