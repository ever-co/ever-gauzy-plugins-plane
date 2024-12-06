import { BadRequestException, Injectable } from '@nestjs/common';
import { IIssue, IIssueCreateInput } from '@plane-plugin/models';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';
import { IssuesService } from '../issues.service';

@Injectable()
export class DraftIssuesService extends ApiFetchService {
	constructor(
		private readonly _issueService: IssuesService,
		private readonly _serverFetchService: ApiFetchService,
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/tasks';

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
				is_draft: true, // Ensures the issue is marked as a draft
			});
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error.response);
		}
	}
}
