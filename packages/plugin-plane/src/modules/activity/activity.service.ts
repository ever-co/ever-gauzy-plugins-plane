import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	IActivityLog,
	IIssueActivityFindInput,
	IPagination
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { getActivityLogsQuery } from '../../config';

@Injectable()
export class ActivityService extends ApiFetchService {
	private readonly path = '/activity-log';

	async findAll(options: IIssueActivityFindInput): Promise<IActivityLog[]> {
		try {
			const query = qs.stringify(getActivityLogsQuery(options));

			const activityLogs: IPagination<IActivityLog> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			console.log(activityLogs.items);

			return activityLogs.items;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}
}
