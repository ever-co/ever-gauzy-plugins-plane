import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	IDashboardWidget,
	IDashboardWidgetCreateInput,
	IWidget
} from '@plane-plugin/models';
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
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}
}
