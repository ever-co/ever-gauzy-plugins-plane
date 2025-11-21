import { IIssue } from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

export class WorkItemsService extends ApiFetchService {
	async browseWorkItemByIdentifier(identifier: string): Promise<IIssue> {
		const response = await this.apiFetch({
			method: 'GET',
			path: `/tasks/${identifier}`
		});
		return response.data;
	}
}
