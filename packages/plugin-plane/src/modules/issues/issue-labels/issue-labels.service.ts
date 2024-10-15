import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ICreateIssueLabelInput,
	ID,
	IIssueLabel,
	IPagination,
	ITag,
	IUpdateIssueLabelInput,
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
	private readonly path = '/tags';

	/**
	 * @description - Get project issue labels
	 * @param {ID} projectId - the project ID for whom getting labels
	 * @returns - A promise that resolves after get labels
	 * @memberof IssueLabelsService
	 */
	async getProjectIssueLabels(
		projectId: ID,
	): Promise<IIssueLabel[] | IIssueLabel> {
		const query = qs.stringify(getLabelsQuery());
		try {
			const labels: IPagination<ITag> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query,
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
					path: `${this.path}`,
					body: {
						...input,
						organizationId: defaultOrganizationId(),
						tenantId: defaultTestTenantId(),
					},
				})
			).data;
			return issueLabelsTransformer(label, projectId);
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Update issue label
	 * @param {ID} id - the label ID to be updated
	 * @param {ID} projectId - the project ID for whom to associate with Updated label
	 * @param {IUpdateIssueLabelInput} input - data for updating label
	 * @returns - A promise that resolves after Updated label
	 * @memberof IssueLabelsService
	 */
	async updateIssueLabel(
		id: ID,
		projectId: ID,
		input: IUpdateIssueLabelInput,
	): Promise<IIssueLabel | IIssueLabel[]> {
		try {
			const label: ITag = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body: input,
				})
			).data;
			return issueLabelsTransformer(label, projectId);
		} catch (error) {
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Delete label
	 * @param {ID} id - The label ID to be deleted
	 * @returns - A promise that resolves after label deleted
	 * @memberof IssueLabelsService
	 */
	async deleteIssueLabel(id: ID): Promise<any> {
		try {
			return (
				await this.apiFetch({
					method: 'DELETE',
					path: `${this.path}/${id}`,
				})
			).data;
		} catch (error) {
			throw new BadRequestException(error);
		}
	}
}
