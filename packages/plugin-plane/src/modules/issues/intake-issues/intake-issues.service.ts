import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IIntakeIssue,
	IIntakeIssueCreateInput,
	IPagination,
	IScreeningTask,
	IssueRelationTypeEnum,
	IState,
	TaskStatusEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	createIntakeIssueInputTransformer,
	getIntakeIssueQuery,
	intakeIssueTranformer,
	screeningStatusToIntakeStatusMap,
	updateIntakeIssueInputTransformer
} from '../../../config';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';
import { IssuesService } from '../issues.service';
import { StatesService } from '../../states/states.service';
import { IssueRelationsService } from '../../issue-relations/issue-relations.service';

@Injectable()
export class IntakeIssuesService extends ApiFetchService {
	constructor(
		private readonly _issuesService: IssuesService,
		private readonly _issueRelationService: IssueRelationsService,
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
			const { state_id } = input.issue!;

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
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Updates an intake issue and its associated issue data.
	 *
	 * This method updates the details of an intake issue, as well as the linked issue data, if provided. It retrieves the
	 * current screening task, applies the necessary transformations, and sends an update request to the API.
	 *
	 * @param {ID} id - The issue ID of the intake issue to be updated.
	 * @param {IIntakeIssueCreateInput} input - The updated data for the intake issue, including optional issue details.
	 * @returns {Promise<IIntakeIssue | IIntakeIssue[]>} A promise resolving to the updated intake issue(s).
	 * @throws {BadRequestException} Throws an exception if an error occurs during the update process.
	 */
	async update(
		id: ID,
		input: IIntakeIssueCreateInput
	): Promise<IIntakeIssue | IIntakeIssue[]> {
		try {
			const { issue, duplicate_to, ...intakeInput } = input;
			const query = qs.stringify(getIntakeIssueQuery(id));

			if (issue) {
				await this._issuesService.update(id, issue, false);
			}
			if (duplicate_to) {
				await this._issueRelationService.create(
					id,
					[duplicate_to],
					IssueRelationTypeEnum.DUPLICATE
				);
			}

			const screeningTask: IPagination<IScreeningTask> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			const intakeIssue = screeningTask.items[0];
			if (Object.keys(intakeInput).length > 0) {
				const body = updateIntakeIssueInputTransformer(intakeInput);
				const screeningIssue = (
					await this.apiFetch({
						method: 'PUT',
						path: `${this.path}/${intakeIssue.id}`,
						body: { ...screeningTask, ...body }
					})
				).data;

				return intakeIssueTranformer(screeningIssue);
			} else {
				return intakeIssueTranformer(intakeIssue);
			}
		} catch (error: any) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Retrieves all intake issues associated with a specific project.
	 *
	 * This method fetches screening tasks, filters them based on the given project ID, and returns a paginated
	 * response with the transformed intake issues.
	 *
	 * @param {ID} projectId - The ID of the project to filter the intake issues by.
	 * @returns {Promise<any>} A promise that resolves to a paginated response containing the filtered intake issues.
	 * @throws {BadRequestException} Throws an exception if the fetching or transformation process fails.
	 */
	async findAll(projectId: ID, status: string): Promise<any> {
		try {
			const query = qs.stringify(getIntakeIssueQuery());

			const screeningTasks: IPagination<IScreeningTask> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			const intakeIssues = screeningTasks.items.filter(
				(screeningTask) => screeningTask.task.projectId === projectId
			);

			// Parse the status parameter into an array of numbers
			const statusFilter = status.split(',').map(Number);

			const filteredIssues = intakeIssues.filter((screeningTask) =>
				statusFilter.includes(
					screeningStatusToIntakeStatusMap(screeningTask.status)
				)
			);

			return {
				grouped_by: null,
				sub_grouped_by: null,
				total_count: filteredIssues.length,
				next_cursor: '10:1:0',
				prev_cursor: '10:-1:1',
				next_page_results: false,
				prev_page_results: false,
				count: filteredIssues.length,
				total_pages: 1,
				total_results: filteredIssues.length,
				extra_stats: null,
				results: intakeIssueTranformer(filteredIssues)
			};
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Retrieves a single intake issue associated with a given task ID.
	 *
	 * This method fetches screening tasks filtered by the provided task ID and returns the transformed intake issue.
	 *
	 * @param {ID} taskId - The ID of the task for which the intake issue is to be retrieved.
	 * @returns {Promise<IIntakeIssue | IIntakeIssue[]>} A promise that resolves to the transformed intake issue(s).
	 * @throws {BadRequestException} Throws an exception if the fetching or transformation process fails.
	 */
	async findOneByTaskId(taskId: ID): Promise<IIntakeIssue | IIntakeIssue[]> {
		try {
			const query = qs.stringify(getIntakeIssueQuery(taskId));

			const task = await this._issuesService.getExternalIssue(taskId);

			const screeningTask: IPagination<IScreeningTask> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			const intakeIssue = screeningTask.items[0];

			return intakeIssueTranformer(intakeIssue, task);
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}
}
