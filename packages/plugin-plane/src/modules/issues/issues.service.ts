import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	ID,
	IIssue,
	IIssueCreateInput,
	IIssueUpdateInput,
	IPagination,
	IState,
	ITask,
	TaskStatusEnum,
} from '@plane-plugin/models';
import {
	createIssueInputTransformer,
	getTaskQuery,
	groupIssuesByStateId,
	issueTransformer,
	updateIssueInputTransformer,
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
	 * @description - Get remode API issue
	 * @private
	 * @param {ID} id - The issue ID
	 * @returns - A promise that resolved after getting issue
	 * @memberof IssuesService
	 */
	private async getRemoteIssue(id: ID): Promise<ITask> {
		const query = qs.stringify(getTaskQuery());
		return (
			await this.apiFetch({
				path: `${this.path}/${id}`,
				method: 'GET',
				query,
			})
		).data;
	}

	/**
	 * @description - Find issue by Id
	 * @param {ID} id - The issue ID to search
	 * @returns - A promise that resolves after issue fetched
	 * @memberof IssuesService
	 */
	async findOne(id: ID): Promise<IIssue> {
		try {
			const issue = await this.getRemoteIssue(id);

			if (!issue) {
				throw new BadRequestException('Issue cnot found');
			}
			return issueTransformer(issue);
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

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

	/**
	 * @description - Update issue
	 * @param {IIssueCreateInput} payload - data for updating issue
	 * @param {ID} id - The issue ID to be updated
	 * @returns - A promise that resolves after issue updated
	 * @memberof IssuesService
	 */
	async update(id: ID, payload: IIssueUpdateInput): Promise<IIssue> {
		try {
			let state: IState;
			if (payload.state_id) {
				state = await this._stateSerive.getOne(payload.state_id);
			}
			const issue = await this.findOne(id);

			const nativeIssue = await this.getRemoteIssue(id);

			if (!issue) {
				throw new BadRequestException('Issue not found');
			}

			const body = updateIssueInputTransformer(
				payload,
				state?.name as TaskStatusEnum,
			);

			const task = (
				await this.apiFetch({
					path: `${this.path}/${id}`,
					method: 'PUT',
					body: {
						...body,
						title: payload.name ?? issue.name,
						status: payload.state_id
							? state.name
							: nativeIssue.status,
					},
				})
			).data;

			return issueTransformer(task);
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	async getAllIssuesByProject(projectId: ID) {
		try {
			const query = qs.stringify(getTaskQuery(projectId));
			const issues: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query,
				})
			).data;

			return groupIssuesByStateId(issues.items);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException();
		}
	}

	async findIssueChildren(
		id: ID,
	): Promise<{ sub_issues: IIssue[]; state_distribution: any }> {
		try {
			const sub_issues: IIssue[] = [];
			const issue = await this.getRemoteIssue(id);
			if (!issue) {
				throw new BadRequestException('Issue could not be found');
			}
			if (issue.children.length > 0) {
				const children = issue.children;
				children.forEach((task) =>
					sub_issues.push(issueTransformer(task)),
				);
			}
			return { sub_issues, state_distribution: {} };
		} catch (error) {}
	}
}
