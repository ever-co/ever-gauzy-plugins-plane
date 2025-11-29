import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { IEmployeeRecentVisit } from '@plane-plugin/models';
import { currentEmployeeId, getEmployeeRecentVisitsQuery } from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class RecentVisitsService extends ApiFetchService {
	private path = '/employee-recent-visit';

	async geEmployeetRecentVisits(): Promise<IEmployeeRecentVisit[]> {
		try {
			const employeeId = currentEmployeeId();
			if (!employeeId) {
				throw new BadRequestException('Employee ID is required');
			}

			const query = qs.stringify(
				getEmployeeRecentVisitsQuery(employeeId)
			);

			const recentVisits = await this.apiFetch({
				method: 'GET',
				path: this.path,
				query
			});

			return recentVisits.data;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
