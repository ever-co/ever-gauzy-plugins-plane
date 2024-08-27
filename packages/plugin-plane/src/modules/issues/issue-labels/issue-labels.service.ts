import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ICreateIssueLabelInput,
	ID,
	IIssueLabel,
	IPagination,
	ITag,
} from '@plane-plugin/models';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';
import {
	defaultOrganizationId,
	defaultTestTenantId,
	getLabelsQuery,
	issueLabelsTransformer,
} from '../../../config';

@Injectable()
export class IssueLabelsService extends ApiFetchService {
	/**
	 * @description - Get project issue labels
	 * @param {ID} projectId - the project ID for whom getting labels
	 * @returns - A promise that resolves after get labels
	 * @memberof IssueLabelsService
	 */
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

	/**
	 * @description - Create issue label
	 * @param {ID} projectId - the project ID for whom to associate with created label
	 * @param {ICreateIssueLabelInput} input - data for creating label
	 * @returns - A promise that resolves after created label
	 * @memberof IssueLabelsService
	 */
	async createIssueLabel(
		projectId: ID,
		input: ICreateIssueLabelInput,
	): Promise<IIssueLabel | IIssueLabel[]> {
		try {
			const label: ITag = (
				await this.apiFetch({
					method: 'POST',
					path: '/tags',
					body: {
						...input,
						organizationId: defaultOrganizationId,
						tenantId: defaultTestTenantId,
					},
				})
			).data;
			return issueLabelsTransformer(label, projectId);
		} catch (error) {
			throw new BadRequestException(error);
		}
	}
}
