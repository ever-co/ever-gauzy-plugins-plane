import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	ID,
	IIssue,
	IIssueCreateInput,
	IPagination,
	ITask,
	TaskStatusEnum,
} from '@plane-plugin/models';
import {
	createIssueInputTransformer,
	getTaskQuery,
	groupIssuesByStateId,
	issueTransformer,
} from '../../config';
import { StatesService } from '../states/states.service';

@Injectable()
export class IssuesService extends ApiFetchService {
	constructor(
		private readonly _stateSerive: StatesService,
		private readonly _serverFetchService: ApiFetchService,
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/tasks';

	/**
	 * @description - Create issue
	 * @param {IIssueCreateInput} payload - data for creating new issue
	 * @returns - A promise that resolves after issue created
	 * @memberof IssuesService
	 */
	async create(payload: IIssueCreateInput): Promise<IIssue> {
		try {
			const state = await this._stateSerive.getOne(payload.state_id);

			const body = createIssueInputTransformer(
				payload,
				state.name as TaskStatusEnum,
			);
			const issue: ITask = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body,
				})
			).data;

			return issueTransformer(issue);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	async getAllIssuesByProject(projectId: ID) {
		try {
			const query = qs.stringify(getTaskQuery(projectId));
			const issues: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}?${query}`,
				})
			).data;

			return groupIssuesByStateId(issues.items);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException();
		}
	}
}
