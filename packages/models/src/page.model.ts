import { ID } from './imports';

/**
 * Plane page as returned by the proxy (Gauzy → Plane format).
 * Mirrors the Plane API `IPage` shape expected by the frontend.
 */
export interface IPage {
	id?: ID;
	name?: string;
	description?: string;
	description_html?: string;
	description_json?: any;
	access?: number; // 0 = public, 1 = private
	is_locked?: boolean;
	is_favorite?: boolean;
	archived_at?: string | null;
	color?: string;
	parent?: ID | null;
	owned_by?: ID;
	workspace?: ID;
	project_ids?: ID[];
	label_ids?: ID[];
	logo_props?: any;
	sort_order?: number;
	external_id?: string | null;
	created_at?: Date;
	updated_at?: Date;
	created_by?: ID;
	updated_by?: ID;
	deleted_at?: Date | null;
}

export interface ICreatePageInput {
	name?: string;
	description?: string;
	description_html?: string;
	description_json?: any;
	description_binary?: string;
	access?: number;
	color?: string;
	parent?: ID | null;
	projects?: ID[];
	labels?: ID[];
	sort_order?: number;
}

export interface IUpdatePageInput extends Partial<ICreatePageInput> {
	is_locked?: boolean;
	archived_at?: string | null;
	external_id?: string | null;
}
