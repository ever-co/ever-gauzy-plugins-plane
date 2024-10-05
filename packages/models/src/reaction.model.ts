import { ID } from './imports';
import { IMemberInfo } from './user.model';

export interface IReactionData {
	id?: ID;
	actor_detail?: IMemberInfo;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
	reaction: string;
	created_by?: ID;
	updated_by?: ID;
	project?: ID;
	workspace?: ID;
	actor?: ID;
	issue?: ID;
	comment?: ID;
}

export interface ICreateReactionInput extends Pick<IReactionData, 'reaction'> {}
