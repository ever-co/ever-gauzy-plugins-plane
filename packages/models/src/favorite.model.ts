import { ID } from './imports';

export interface IFavoriteData {
	id?: ID;
	entity_type?: FavoriteEntityTypeEnum;
	entity_identifier?: ID;
	entity_data?: IFavoriteEntityData;
	name?: string;
	is_folder?: boolean;
	sequence?: number;
	parent?: ID;
	workspace_id?: ID;
	project_id?: ID;
}

export interface IFavoriteEntityData {
	id?: ID;
	name?: string;
	logo_props?: any;
	project_id?: ID;
}

export interface ICreateFavoriteInput {
	entity_identifier: ID;
	entity_type: FavoriteEntityTypeEnum;
	is_folder: boolean;
	parent: ID;
	project_id: ID;
	entity_data?: IFavoriteEntityData;
}

export enum FavoriteEntityTypeEnum {
	MODULE = 'module',
	PROJECT = 'project',
	CYCLE = 'cycle'
}
