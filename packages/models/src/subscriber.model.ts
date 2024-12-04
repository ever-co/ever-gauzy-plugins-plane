import { ID } from './imports';

export interface ISubscriber {
	id: ID;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
	created_by?: ID;
	updated_by?: ID;
	project?: ID;
	workspace?: ID;
	issue?: ID;
	subscriber?: ID;
}
