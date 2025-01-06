import {
	IDashboard,
	IDashboardWidget,
	IHomeDashboard,
	IWidget
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

/**
 * Transforms an external Dashboard entity into a Plane Home Dashboard format
 *
 * @param dashboard - The source Dashboard object implementing IDashboard interface
 * @returns {IHomeDashboard} - The transformed dashboard object in Plane format
 */

export function dashboardTransformer(dashboard: IDashboard): IHomeDashboard {
	return {
		id: dashboard.id,
		created_at: dashboard.createdAt,
		updated_at: dashboard.updatedAt,
		deleted_at: dashboard.deletedAt,
		name: dashboard.name,
		description_html: dashboard.description,
		identifier: dashboard.identifier,
		type_identifier: dashboard.identifier,
		logo_props: {},
		created_by: dashboard.creatorId,
		updated_by: null,
		owned_by: null
	};
}

/**
 * Transforms dashboard widget(s) from internal format to Plane widget format
 *
 * @param {IDashboardWidget | IDashboardWidget[]} widgets - Single widget or array of widgets to transform
 * @returns {IWidget | IWidget[]} - Transformed widget(s) in Plane format
 */

export function widgetTransformer(
	widgets: IDashboardWidget | IDashboardWidget[]
): IWidget | IWidget[] {
	const transformWidget = (widget: IDashboardWidget): IWidget => {
		return {
			id: widget.id,
			key: widget.name,
			is_visible: widget.isVisible,
			widget_filters: widget.options
		};
	};

	if (Array.isArray(widgets)) {
		return widgets.map(transformWidget);
	}

	return transformWidget(widgets);
}

/**
 * Generates a query object for retrieving dashboards with optional type filtering
 *
 * @param {string} [dashboard_type] - Optional dashboard type identifier to filter by
 * @returns {Record<string, string>} Query parameters as key-value pairs
 */

export function getDashboardQuery(
	dashboard_type?: string
): Record<string, string> {
	// Tenant and Organization based query
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery()
	};

	if (!dashboard_type) {
		query['where[identifier]'] = dashboard_type;
	}

	return query;
}
