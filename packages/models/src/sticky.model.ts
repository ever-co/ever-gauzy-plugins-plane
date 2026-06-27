import { ID } from './imports';

/**
 * Plane Sticky interface — the shape returned by the proxy to the frontend.
 */
export interface ISticky {
	id?: ID;
	name?: string | null;
	description?: Record<string, any>;
	description_html?: string;
	description_stripped?: string | null;
	color?: string | null;
	background_color?: string | null;
	logo_props?: Record<string, any>;
	sort_order?: number;
	workspace_id?: ID;
	owner_id?: ID;
	created_at?: Date | string;
	updated_at?: Date | string;
}

export interface IStickyCreateInput {
	name?: string | null;
	description?: Record<string, any>;
	description_html?: string;
	color?: string | null;
	background_color?: string | null;
	logo_props?: Record<string, any>;
	sort_order?: number;
}

export type IStickyUpdateInput = Partial<IStickyCreateInput>;
