import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	IActivityLog,
	IIssueActivityFindInput,
	IPagination
} from '@ever-gauzy/plugin-integration-plane-models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { getActivityLogsQuery } from '../../config';

@Injectable()
export class ActivityService extends ApiFetchService {
	private readonly path = '/activity-log';

	/**
	 * Finds all activity logs for a given issue activity find input.
	 * @param options - The options for the activity log find input.
	 * @returns A promise that resolves to an array of activity logs.
	 * @throws {BadRequestException} If the API request fails.
	 */
	async findAll(options: IIssueActivityFindInput): Promise<IActivityLog[]> {
		try {
			const query = qs.stringify(getActivityLogsQuery(options));

			const activityLogs: IPagination<IActivityLog> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			return activityLogs.items;
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}
}
