import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	ID,
	IDashboardWidget,
	IDashboardWidgetCreateInput,
	IDashboardWidgetUpdateInput,
	IWidget
} from '@ever-gauzy/plugin-integration-plane-models';
import { widgetTransformer } from '../../config';

@Injectable()
export class WidgetService extends ApiFetchService {
	private readonly path = '/dashboard-widget';

	/**
	 * Creates a new dashboard widget.
	 *
	 * @param {IDashboardWidgetCreateInput} input - The input data for creating a dashboard widget
	 * @returns {Promise<IWidget | IWidget[]>} A promise that resolves to either a single widget or an array of widgets
	 * @throws {BadRequestException} Throws an error if widget creation fails
	 */
	async create(
		input: IDashboardWidgetCreateInput
	): Promise<IWidget | IWidget[]> {
		try {
			const dashboardWidget: IDashboardWidget = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body: input
				})
			).data;

			return widgetTransformer(dashboardWidget);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Updates an existing dashboard widget.
	 *
	 * @param {ID} id - The unique identifier of the dashboard widget to update
	 * @param {IDashboardWidgetUpdateInput} input - The input data containing widget properties to update
	 * @returns {Promise<IWidget | IWidget[]>} A promise that resolves to either the updated widget or array of widgets
	 * @throws {BadRequestException} Throws an error if widget update fails
	 */
	async update(
		id: ID,
		input: IDashboardWidgetUpdateInput
	): Promise<IWidget | IWidget[]> {
		try {
			const dashboardWidget: IDashboardWidget = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body: input
				})
			).data;

			return widgetTransformer(dashboardWidget);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}
}
