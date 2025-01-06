import { ID } from './imports';

export interface IHomeDashboard {
	id?: ID;
	created_at?: Date;
	updated_at?: Date;
	deleted_at?: Date;
	name?: string;
	description_html?: string;
	identifier?: string;
	is_default?: boolean;
	type_identifier?: string;
	logo_props?: any;
	created_by?: ID;
	updated_by?: ID;
	owned_by?: ID;
}

export interface IWidget {
	id?: ID;
	key?: string;
	is_visible: boolean;
	widget_filters: any;
}
