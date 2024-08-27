import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { ID, IIssueLabel, IPagination, ITag } from '@plane-plugin/models';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';
import {
	getLabelsQuery,
	issueLabelsTransformer,
} from 'packages/plugin-plane/src/config';

@Injectable()
export class IssueLabelsService extends ApiFetchService {
	async getProjectIssueLabels(
		projectId: ID,
	): Promise<IIssueLabel[] | IIssueLabel> {
		const query = qs.stringify(getLabelsQuery);
		try {
			const labels: IPagination<ITag> = (
				await this.apiFetch({
					method: 'GET',
					path: `/tags?${query}`,
				})
			).data;

			return issueLabelsTransformer(labels.items, projectId);
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException();
		}
	}
}
