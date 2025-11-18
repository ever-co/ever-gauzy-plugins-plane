import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import moment from 'moment';
import qs from 'qs';
import {
	BaseEntityEnum,
	EmployeeSettingTypeEnum,
	ICycle,
	ICycleAnalytics,
	ICycleIssuesResponse,
	ICycleProgress,
	ID,
	IOrganizationSprint,
	IPagination,
	IUpdateUserPropertiesInput,
	IUserViewProperties
} from '@plane-plugin/models';
import {
	createCycleInputTransformer,
	currentEmployeeId,
	cycleAnalyticsData,
	cycleIssueTransformer,
	cycleRelations,
	cycleTransformer,
	employeeSettingSerializer,
	getSprintsQuery,
	getTaskCounts,
	issueTransformer,
	MEMBER_DEFAULT_VIEW_PROPS,
	retrieveCycleTotalTasks,
	updateCycleInputTransformer
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { UserFavoritesService } from '../user-favorites/user-favorites.service';
import { IssuesService } from '../issues/issues.service';
import { EmployeePropertiesService } from '../employee-properties/employee-properties.service';

@Injectable()
export class CyclesService extends ApiFetchService {
	constructor(
		private readonly _serverFetchService: ApiFetchService,

		@Inject(forwardRef(() => IssuesService))
		private readonly _issueService: IssuesService,

		@Inject(forwardRef(() => UserFavoritesService))
		private readonly _userFavoriteService: UserFavoritesService,

		private readonly _employeePropertiesService: EmployeePropertiesService
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/organization-sprint';

	/**
	 * @description Find a sprint from external API
	 * @param {ID} id - The sprint ID to find
	 * @param {ID} [projectId] - Optional Project ID to filter search
	 * @returns {Promise<IOrganizationSprint>} - A promise resolved to found Sprint
	 * @memberof CyclesService
	 */
	async getExternalSprint(
		id: ID,
		projectId?: ID,
		relations?: string[]
	): Promise<IOrganizationSprint> {
		// Build the query string once
		const query = qs.stringify(getSprintsQuery(projectId, relations));

		return await (
			await this.apiFetch({
				method: 'GET',
				path: `${this.path}/${id}`,
				query
			})
		).data;
	}

	/**
	 * Creates a new cycle and returns the transformed cycle or cycles.
	 *
	 * @param {ICycle} input - The cycle data used to create a new cycle.
	 * @returns {Promise<ICycle | ICycle[]>} - The created cycle or a list of cycles after transformation.
	 * @throws {BadRequestException} - Throws an error if the creation fails.
	 */
	async create(input: ICycle): Promise<ICycle | ICycle[]> {
		try {
			// Build the body request
			const body = createCycleInputTransformer(input);

			const sprint: IOrganizationSprint = (
				await this.apiFetch({ method: 'POST', path: this.path, body })
			).data;

			// Return the transformed sprint
			return cycleTransformer(sprint);
		} catch (error: any) {
			console.log({ failed: error.response.data.message });
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Updates an existing cycle by its ID and returns the transformed cycle or cycles.
	 *
	 * @param {ID} id - The unique identifier of the cycle to update.
	 * @param {ICycle} input - The updated cycle data.
	 * @returns {Promise<ICycle | ICycle[]>} - The updated cycle or a list of updated cycles after transformation.
	 * @throws {BadRequestException} - Throws an error if the update fails.
	 */
	async update(
		id: ID,
		input: Partial<Omit<ICycle, 'id'>>
	): Promise<ICycle | ICycle[]> {
		try {
			// Build the body request
			const body = updateCycleInputTransformer(input);

			const sprint: IOrganizationSprint = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body
				})
			).data;

			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					BaseEntityEnum.OrganizationSprint
				);

			return cycleTransformer(sprint, favoriteIds);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Retrieves all cycles (sprints) optionally filtered by a project ID and returns the transformed result.
	 *
	 * @param {ID} [projectId] - Optional project ID to filter the cycles by project.
	 * @returns {Promise<ICycle | ICycle[]>} - A list of cycles or a single cycle after transformation.
	 * @throws {BadRequestException} - Throws an error if the fetching process fails.
	 */
	async findAll(projectId?: ID): Promise<ICycle | ICycle[]> {
		try {
			// Build the query string once
			const query = qs.stringify(getSprintsQuery(projectId));

			// Search for user favorites
			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					BaseEntityEnum.OrganizationSprint
				);

			// Perform the API call to fetch the sprints
			const sprints: IPagination<IOrganizationSprint> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;

			// Return the transformed sprints
			return cycleTransformer(sprints.items, favoriteIds);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves a specific cycle (sprint) by its ID, optionally filtered by project ID, and returns the transformed result.
	 *
	 * @param {ID} [id] - The unique identifier of the cycle to retrieve.
	 * @param {ID} [projectId] - Optional project ID to further filter the cycle.
	 * @returns {Promise<ICycle | ICycle[]>} - The retrieved cycle or a list of cycles after transformation.
	 * @throws {BadRequestException} - Throws an error if the retrieval process fails.
	 */
	async findOne(id?: ID, projectId?: ID): Promise<ICycle | ICycle[]> {
		try {
			const sprint = await this.getExternalSprint(id, projectId);

			// Search for user favorites
			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					BaseEntityEnum.OrganizationSprint
				);

			return cycleTransformer(sprint, favoriteIds);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Adds a list of issues to a sprint by updating each issue with the given cycle ID.
	 * Utilizes `Promise.all` to perform asynchronous updates on multiple issues concurrently.
	 *
	 * @param {ID} id - The ID of the sprint (cycle) to which the issues will be added.
	 * @param {ID[]} input - An array of issue IDs that need to be associated with the sprint.
	 * @returns {Promise<{ message: string }>} A success message upon completion.
	 * @throws {BadRequestException} If there is an error during the update of any issue.
	 */
	async addIssuesToSprint(
		id: ID,
		input: { issues: ID[] }
	): Promise<{ message: string }> {
		try {
			await Promise.all(
				input.issues.map(
					async (issue) =>
						await this._issueService.update(
							issue,
							{
								cycle_id: id
							},
							false
						)
				)
			);

			return { message: 'success' };
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Removes an issue from a sprint by updating the issue with the given cycle ID to null.
	 *
	 * @param {ID} issueId - The ID of the issue to be removed from the sprint.
	 * @returns promise that resolves to the updated issue.
	 * @throws {BadRequestException} If there is an error during the update of the issue.
	 */
	async removeIssueFromSprint(issueId: ID) {
		try {
			return await this._issueService.update(
				issueId,
				{ cycle_id: null },
				false
			);
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Retrieves all tasks that were ever part of a sprint (current and previous).
	 * This method combines current and previous sprint tasks, ensuring no duplicates.
	 *
	 * @param {ID} id - The ID of the sprint (cycle).
	 * @param {ID} projectId - The ID of the project to which the sprint belongs.
	 * @returns {Promise<ICycleIssuesResponse>} - A transformed response containing all unique sprint issues.
	 * @throws {NotFoundException} - If the sprint is not found.
	 * @throws {BadRequestException} - For other errors, with the error response passed in the exception.
	 */
	async findCycleIssues(
		id: ID,
		projectId: ID
	): Promise<ICycleIssuesResponse> {
		try {
			// Retrieve the sprint (cycle) using the provided IDs
			const cycle = await this.getExternalSprint(id, projectId);

			if (!cycle) {
				throw new NotFoundException('Cycle not found.');
			}

			// Combine both current and previous tasks, ensuring uniqueness based on task ID
			const allIssues = retrieveCycleTotalTasks(cycle).map((task) =>
				issueTransformer(task)
			);

			// Transform and return the combined tasks
			return cycleIssueTransformer(allIssues);
		} catch (error: any) {
			// Log the error and throw a BadRequestException
			console.log(error);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Checks for overlaps with existing cycles before creating a new cycle.
	 *
	 * @param input The start and end dates for the new cycle to be created.
	 * @returns The status and optional error according to overlaps existing
	 */
	async checkDatesOverlap(
		input: Pick<ICycle, 'start_date' | 'end_date'>,
		projectId?: ID
	) {
		try {
			// Retrieve existing cycles
			const cycles = (await this.findAll(projectId)) as ICycle[];

			// Check for date overlaps using moment.js
			const hasOverlap = this.checkForDateOverlap(
				cycles,
				input.start_date,
				input.end_date
			);

			if (hasOverlap) {
				return {
					error: 'You have a cycle already on the given dates, if you want to create a draft cycle you can do that by removing dates',
					status: false
				};
			}
			return { status: true };
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Deletes a specific cycle (sprint) by its ID.
	 *
	 * @param {ID} id - The unique identifier of the cycle to delete.
	 * @returns {Promise<any>} - The response data from the delete operation.
	 * @throws {BadRequestException} - Throws an error if the deletion process fails.
	 */
	async delete(id: ID): Promise<any> {
		return (
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${id}/soft`
			})
		).data;
	}

	/**
	 * Checks for date overlaps between existing cycles and the new dates.
	 * Uses `moment` for more precise date comparisons.
	 * @param cycles The existing cycles.
	 * @param startDate The start date of the new cycle.
	 * @param endDate The end date of the new cycle.
	 * @returns true if there is an overlap, otherwise false.
	 */
	private checkForDateOverlap(
		cycles: ICycle[],
		startDate: Date,
		endDate: Date
	): boolean {
		const newStart = moment(startDate).startOf('day'); // Ignore time, use only the date
		const newEnd = moment(endDate).startOf('day'); // Ignore time, use only the date

		return cycles.some((cycle) => {
			const existingStart = moment(cycle.start_date).startOf('day'); // Ignore time, use only the date
			const existingEnd = moment(cycle.end_date).startOf('day'); // Ignore time, use only the date

			// Check for overlaps using moment methods (date-only)
			const isOverlap =
				newStart.isBefore(existingEnd) && newEnd.isAfter(existingStart);

			return isOverlap;
		});
	}

	/**
	 * Finds or creates cycle user properties for a specific cycle (sprint).
	 *
	 * If the user's settings for the given cycle are not found, it will attempt
	 * to create a new one with default properties.
	 *
	 * @param {ID} id - The identifier of the cycle (sprint).
	 * @returns {Promise<any>} Serialized user setting for the cycle.
	 * @throws {BadRequestException} Throws if the operation fails.
	 */
	async findCycleUserProperties(id: ID): Promise<any> {
		try {
			// Attempt to find existing user properties for the cycle
			const memberSetting =
				await this._employeePropertiesService.findOneByOptions({
					employeeId: currentEmployeeId(),
					entity: BaseEntityEnum.OrganizationSprint,
					entityId: id,
					settingType: EmployeeSettingTypeEnum.TASK_VIEWS
				});

			if (!memberSetting) {
				throw new BadRequestException('User view properties not found');
			}

			// If found, return the serialized settings
			return employeeSettingSerializer(memberSetting);
		} catch (error) {
			try {
				// Create new setting with default properties if none exist for cycle.
				const cycleMemberSetting =
					await this._employeePropertiesService.create({
						entity: BaseEntityEnum.OrganizationSprint,
						entityId: id,
						settingType: EmployeeSettingTypeEnum.TASK_VIEWS,
						data: MEMBER_DEFAULT_VIEW_PROPS,
						defaultData: MEMBER_DEFAULT_VIEW_PROPS,
						employee: { id: currentEmployeeId() },
						employeeId: currentEmployeeId()
					});

				return employeeSettingSerializer(cycleMemberSetting);
			} catch (error) {
				console.log(error);
				throw new BadRequestException(
					'Failed to find or create new view properties'
				);
			}
		}
	}

	/**
	 * Updates or creates cycle user properties for a specific cycle (sprint).
	 *
	 * If the user's settings for the given cycle already exist, they will be updated.
	 * Otherwise, new settings will be created with default properties.
	 *
	 * @param {ID} id - The identifier of the cycle (sprint).
	 * @param {IUpdateUserPropertiesInput} input - The updated properties input.
	 * @returns {Promise<IUserViewProperties>} The updated or newly created user properties.
	 * @throws {BadRequestException} Throws if the operation fails.
	 */
	async updateCycleUserProperties(
		id: ID,
		input: IUpdateUserPropertiesInput
	): Promise<IUserViewProperties> {
		try {
			// Destructure input properties
			const {
				display_filters,
				display_properties,
				filters,
				rich_filters
			} = input;

			// Find existing employee settings for the given cycle
			let memberSetting =
				await this._employeePropertiesService.findOneByOptions({
					employeeId: currentEmployeeId(),
					entity: BaseEntityEnum.OrganizationSprint,
					entityId: id,
					settingType: EmployeeSettingTypeEnum.TASK_VIEWS
				});

			if (memberSetting) {
				// Update the existings with new data or fallback to existing data
				const data: Record<string, any> = memberSetting.data as Record<
					string,
					any
				>;

				memberSetting = await this._employeePropertiesService.update(
					memberSetting.id,
					{
						...memberSetting,
						data: {
							filters: filters ?? data.filters,
							rich_filters: rich_filters ?? data.rich_filters,
							display_filters:
								display_filters ?? data.display_filters,
							display_properties:
								display_properties ?? data.display_properties
						}
					}
				);
			} else {
				// Create new setting with default properties if none exist
				memberSetting = await this._employeePropertiesService.create({
					entity: BaseEntityEnum.OrganizationSprint,
					entityId: id,
					settingType: EmployeeSettingTypeEnum.TASK_VIEWS,
					data: MEMBER_DEFAULT_VIEW_PROPS,
					defaultData: MEMBER_DEFAULT_VIEW_PROPS,
					employee: { id: currentEmployeeId() },
					employeeId: currentEmployeeId()
				});
			}

			// Serialize and return the updated/created employee setting
			return employeeSettingSerializer(memberSetting);
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Retrieves analytics data for a specific cycle within a project.
	 *
	 * This function fetches the cycle/sprint data along with its associated tasks and task histories.
	 * It analyzes tasks to provide statistics about task completion, assignments, and labels.
	 *
	 * @param {ID} cycleId - The ID of the cycle to analyze
	 * @param {ID} projectId - The ID of the project containing the cycle
	 * @returns {Promise<any>} A promise that resolves to the cycle analytics data including:
	 *   - Task completion statistics
	 *   - Assignment distribution
	 *   - Label distribution
	 * @throws {BadRequestException} If there is an error fetching or processing the data
	 */
	async findCycleAnalytics(
		cycleId: ID,
		projectId: ID
	): Promise<ICycleAnalytics> {
		try {
			const sprint = await this.getExternalSprint(cycleId, projectId, [
				...cycleRelations,
				'tasks.tags',
				'tasks.taskStatus',
				'toSprintTaskHistories.task.tags',
				'toSprintTaskHistories.task.taskStatus',
				'fromSprintTaskHistories.task.tags',
				'fromSprintTaskHistories.task.taskStatus'
			]);

			return cycleAnalyticsData(sprint);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Retrieves the progress of a specific cycle within a project, including task counts
	 * and estimation points for various statuses (e.g., backlog, started, completed).
	 *
	 * @param {ID} cycleId - The unique identifier of the cycle to retrieve progress for.
	 * @param {ID} projectId - The unique identifier of the project the cycle belongs to.
	 * @returns {Promise<ICycleProgress>} - A promise that resolves to an object containing
	 *   detailed cycle progress, including task counts and estimation points.
	 *
	 * @throws {BadRequestException} - Throws an exception if the external sprint cannot
	 *   be retrieved or any error occurs during the process.
	 */
	async getCycleProgress(
		cycleId: ID,
		projectId: ID
	): Promise<ICycleProgress> {
		try {
			const sprint = await this.getExternalSprint(cycleId, projectId, [
				'tasks.taskStatus',
				'toSprintTaskHistories.task.taskStatus',
				'fromSprintTaskHistories.task.taskStatus'
			]);

			const tasks = retrieveCycleTotalTasks(sprint);

			const {
				backlogIssues,
				startedIssues,
				completedIssues,
				unstartedIssues
			} = getTaskCounts(tasks);

			return {
				backlog_estimate_points: 0,
				unstarted_estimate_points: 0,
				started_estimate_points: 0,
				cancelled_estimate_points: 0,
				completed_estimate_points: 0,
				total_estimate_points: 0.0,
				backlog_issues: backlogIssues,
				total_issues: tasks.length,
				completed_issues: completedIssues,
				cancelled_issues: 0,
				started_issues: startedIssues,
				unstarted_issues: unstartedIssues
			};
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
