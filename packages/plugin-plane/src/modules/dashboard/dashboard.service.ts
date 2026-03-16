import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IDashboard,
	IDashboardCreateInput,
	IPagination
} from '@ever-gauzy/plugin-integration-plane-models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { getDashboardQuery } from '../../config/serializers/dashboard';
import { WidgetService } from './widget.service';

@Injectable()
export class DashboardService extends ApiFetchService {
	constructor(
		private readonly _widgetService: WidgetService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

	private path = '/dashboard';

	/**
	 * Creates a new dashboard.
	 *
	 * @param {IDashboardCreateInput} input - The input data for creating a dashboard
	 * @returns {Promise<IDashboard>} A promise that resolves to the created dashboard
	 * @throws {BadRequestException} Throws if dashboard creation fails
	 */
	async create(input: IDashboardCreateInput): Promise<IDashboard> {
		try {
			const dashboard = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body: input
				})
			).data;

			return dashboard;
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Updates a specific dashboard widget's settings.
	 *
	 * @param {ID} [id] - The unique identifier of the widget to update
	 * @param {any} [input] - The input data containing widget settings to update
	 * @returns A promise that resolves to a success message
	 */
	async updateDashboardWidget(id?: ID, input?: any): Promise<any> {
		try {
			await this._widgetService.update(id!, { options: input.filters });
			return { message: 'successfully updated' };
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error.response);
		}
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
			// this.logger.error(`Operation failed: ${error?.response?.data?.message || error.message}`, error.stack);
			throw new BadRequestException(error);
		}
	}
}
