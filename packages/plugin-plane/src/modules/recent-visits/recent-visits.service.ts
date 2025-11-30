import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	IEmployeeRecentVisit,
	IPagination,
	IRecentVisit
} from '@plane-plugin/models';
import { currentEmployeeId, getEmployeeRecentVisitsQuery } from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { recentVisitTransformer } from '../../config/serializers/recent-visits/recent-visits.serializer';

@Injectable()
export class RecentVisitsService extends ApiFetchService {
	private path = '/employee-recent-visit';

	/**
	 * Retrieves the recent visits for the current employee.
	 *
	 * @returns {Promise<IRecentVisit[] | IRecentVisit>} A promise that resolves to an array of recent visits or a single recent visit.
	 * @throws {BadRequestException} If an error occurs during the fetch.
	 */
	async geEmployeetRecentVisits(): Promise<IRecentVisit[] | IRecentVisit> {
		try {
			const employeeId = currentEmployeeId();
			if (!employeeId) {
				throw new BadRequestException('Employee ID is required');
			}

			const query = qs.stringify(
				getEmployeeRecentVisitsQuery(employeeId)
			);

			const recentVisits: IPagination<IEmployeeRecentVisit> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;

			return recentVisitTransformer(recentVisits.items);
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
