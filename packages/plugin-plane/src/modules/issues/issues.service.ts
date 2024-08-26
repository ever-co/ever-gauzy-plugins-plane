import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { ID, IPagination, ITask } from '@plane-plugin/models';
import { getTaskQuery, groupIssuesByStateId } from '../../config';

@Injectable()
export class IssuesService extends ApiFetchService {
	async getAllIssuesByProject(projectId: ID) {
		try {
			const query = qs.stringify(getTaskQuery(projectId));
			const issues: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `/tasks?${query}`,
				})
			).data;

			return groupIssuesByStateId(issues.items);
		} catch (error) {
			throw new BadRequestException();
		}
	}
}
