import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { IIssue } from '@plane-plugin/models';
import {
	getTaskByIdentifierQuery,
	issueTransformer
} from '../../config/serializers/tasks/tasks.serializer';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class WorkItemsService extends ApiFetchService {
	/**
	 * Browse work item by identifier
	 * @param {string} identifier - The identifier of the work item
	 * @returns {Promise<IIssue>} A promise that resolves to the work item
	 * @throws {BadRequestException} If an error occurs during the fetch
	 */
	async browseWorkItemByIdentifier(identifier: string): Promise<IIssue> {
		try {
			const query = qs.stringify(getTaskByIdentifierQuery(identifier));
			const response = await this.apiFetch({
				method: 'GET',
				path: `/tasks`,
				query
			});

			console.log({ issues: response.data.items });

			return issueTransformer(response.data.items[0]);
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}
}
