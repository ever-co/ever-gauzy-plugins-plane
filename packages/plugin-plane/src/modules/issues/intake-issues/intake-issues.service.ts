import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IIntakeIssue,
	IIntakeIssueCreateInput,
	IPagination,
	IScreeningTask,
	IState,
	TaskStatusEnum
} from '@plane-plugin/models';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';
import { StatesService } from '../../states/states.service';
import {
	createIntakeIssueInputTransformer,
	getIntakeIssueQuery,
	intakeIssueTranformer
} from '../../../config';

@Injectable()
export class IntakeIssuesService extends ApiFetchService {
	constructor(
		private readonly _stateSerive: StatesService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}
	private readonly path = '/screening-tasks';

	/**
	 * Creates a new intake issue by transforming the input and interacting with external services.
	 *
	 * @param {IIntakeIssueCreateInput} input - The input data to create an intake issue.
	 * @returns {Promise<IIntakeIssue | IIntakeIssue[]>} A promise that resolves to a single intake issue or an array of intake issues.
	 * @throws {BadRequestException} Throws an exception if the intake issue creation fails.
	 */
	async create(
		input: IIntakeIssueCreateInput,
		projectId: ID
	): Promise<IIntakeIssue | IIntakeIssue[]> {
		try {
			const { state_id } = input.issue;

			// Set default status
			let state: IState = { name: TaskStatusEnum.BACKLOG };
			if (state_id && state_id.length > 0) {
				state = await this._stateSerive.getOne(state_id);
			}

			const body = createIntakeIssueInputTransformer(
				input,
				state.name as TaskStatusEnum,
				projectId
			);

			const screeningTask: IScreeningTask = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body
				})
			).data;

			return intakeIssueTranformer(screeningTask);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	async finAll(projectId: ID): Promise<any> {
		try {
			const query = qs.stringify(getIntakeIssueQuery());

			const screeningTasks: IPagination<IScreeningTask> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			const intakeIssues = screeningTasks.items.filter(
				(screeninTask) => screeninTask.task.projectId === projectId
			);

			return {
				grouped_by: null,
				sub_grouped_by: null,
				total_count: intakeIssues.length,
				next_cursor: '10:1:0',
				prev_cursor: '10:-1:1',
				next_page_results: false,
				prev_page_results: false,
				count: intakeIssues.length,
				total_pages: 1,
				total_results: intakeIssues.length,
				extra_stats: null,
				results: intakeIssueTranformer(intakeIssues)
			};
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
