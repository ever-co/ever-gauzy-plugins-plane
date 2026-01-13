import { BadRequestException, Injectable } from '@nestjs/common';
import {
	ID,
	IIssue,
	IIssueCreateInput,
	IIssueUpdateInput
} from '@plane-plugin/models';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';
import { IssuesService } from '../issues.service';
import { nonGroupedIssues } from '../../../config';

@Injectable()
export class DraftIssuesService extends ApiFetchService {
	constructor(
		private readonly _issueService: IssuesService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly is_draft = true;

	/**
	 * Creates a new draft issue.
	 *
	 * @param {IIssueCreateInput} input - The input data required to create a draft issue.
	 * @returns {Promise<IIssue>} A promise that resolves to the newly created draft issue.
	 * @throws {BadRequestException} If the creation process fails or an API error occurs.
	 */
	async create(input: IIssueCreateInput): Promise<IIssue> {
		try {
			return await this._issueService.create({
				...input,
				is_draft: this.is_draft // Ensures the issue is marked as a draft
			});
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Updates an issue with the given ID and input data, ensuring it remains a draft.
	 *
	 * @param {ID} id - The unique identifier of the issue to update.
	 * @param {IIssueUpdateInput} input - The data to update the issue with.
	 * @returns {Promise<IIssue>} A promise that resolves to the updated issue.
	 * @throws {BadRequestException} Throws an exception if the update operation fails.
	 */
	async update(id: ID, input: IIssueUpdateInput): Promise<IIssue> {
		try {
			return await this._issueService.update(
				id,
				{
					...input,
					is_draft: this.is_draft
				},
				this.is_draft
			);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Retrieves all draft issues.
	 *
	 * @returns {Promise<any>} A promise that resolves to a list of transformed issues.
	 * @throws {BadRequestException} Throws an exception if the retrieval or processing of issues fails.
	 */
	async findAll(): Promise<any> {
		try {
			const tasks = await this._issueService.findAllExternal(
				{},
				null,
				null,
				true
			);

			return nonGroupedIssues(tasks.items);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error.response);
		}
	}

	async dratfToIssue(id: ID, input: IIssueUpdateInput): Promise<IIssue> {
		try {
			return await this._issueService.update(
				id,
				{
					...input,
					is_draft: false
				},
				this.is_draft
			);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error.response);
		}
	}
}
