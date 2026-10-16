import { ID } from './imports';

/**
 * Plane estimate systems. The proxy maps a project's Ever Gauzy task sizes onto "points" (all sizes numeric) or
 * "categories" (named sizes); Plane's "time" system is not offered.
 */
export enum EstimateSystemEnum {
	POINTS = 'points',
	CATEGORIES = 'categories',
	TIME = 'time'
}

export interface IEstimatePoint {
	id?: ID;
	key?: number;
	value?: string;
	description?: string;
	workspace?: ID;
	project?: ID;
	estimate?: ID;
	created_at?: Date;
	updated_at?: Date;
	created_by?: ID;
	updated_by?: ID;
}

export interface IEstimate {
	id?: ID;
	name?: string;
	description?: string;
	type?: EstimateSystemEnum;
	points?: IEstimatePoint[];
	workspace?: ID;
	project?: ID;
	last_used?: boolean;
	created_at?: Date;
	updated_at?: Date;
	created_by?: ID;
	updated_by?: ID;
}

/**
 * Body of `POST /projects/:projectId/estimates/`.
 */
export interface IEstimateCreateInput {
	estimate?: {
		name?: string;
		type?: string;
		last_used?: boolean;
	};
	estimate_points?: {
		id?: ID;
		key?: number;
		value: string;
	}[];
}

/**
 * Body of the estimate point create/update routes.
 */
export interface IEstimatePointInput {
	key?: number;
	value?: string;
	description?: string;
}
