import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { ID, IDashboard, IPagination } from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { getDashboardQuery } from '../../config/serializers/dashboard';

@Injectable()
export class DashboardService extends ApiFetchService {
	private path = '/dashboard';

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication
	 *--------------------------------------------------------------/
	 */

	/**
	 * Updates a specific dashboard widget's settings.
	 *
	 * @param {ID} [widgetId] - The unique identifier of the widget to update
	 * @param {any} [input] - The input data containing widget settings to update
	 * @returns A promise that resolves to a success message
	 */
	async updateDashboardWidget(widgetId?: ID, input?: any): Promise<any> {
		console.log({ widgetId, input });
		return { message: 'successfully updated' };
	}

	/**
	 * Finds a dashboard by its identifier.
	 *
	 * @param {string} dashboard_type - The identifier of the dashboard to find
	 * @returns {Promise<IDashboard>} A promise that resolves to the found dashboard
	 * @throws {BadRequestException} Throws if the dashboard cannot be found or retrieved
	 */
	async findDashboardByIdentifier(
		dashboard_type: string
	): Promise<IDashboard> {
		try {
			const query = qs.stringify(getDashboardQuery(dashboard_type));

			const dashboard: IPagination<IDashboard> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;

			return dashboard.items[0];
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}
}
