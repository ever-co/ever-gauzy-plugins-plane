import {
	BadGatewayException,
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
	NotFoundException
} from '@nestjs/common';
import qs from 'qs';
import {
	BaseEntityEnum,
	EmployeeSettingTypeEnum,
	IAssignMembersToProject,
	ICreateProjectInput,
	ID,
	IGetProjectMembersResponse,
	IOrganizationProject,
	IPagination,
	IProject,
	IUpdateProjectInput,
	IUpdateUserPropertiesInput,
	IUserViewProperties
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	assignMembersToProjectTransformer,
	baseGetItemsWhereQuery,
	createProjectInputTransformer,
	currentEmployeeId,
	currentTenantId,
	getCurrentOrganizationSlug,
	employeeSettingSerializer,
	fetchWithSplitRelations,
	findEmployeeProjectsQuery,
	getProjectsQuery,
	getProjectsResponse,
	isEmpty,
	MEMBER_DEFAULT_VIEW_PROPS,
	projectRelations
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { WorkspaceService } from '../workspace/workspace.service';
import { UserFavoritesService } from '../user-favorites/user-favorites.service';
import { EmployeePropertiesService } from '../employee-properties/employee-properties.service';

@Injectable()
export class ProjectService extends ApiFetchService {
	constructor(
		@Inject(forwardRef(() => WorkspaceService))
		private readonly _workspaceService: WorkspaceService,
		private readonly _userFavoriteService: UserFavoritesService,
		private readonly _employeePropertiesService: EmployeePropertiesService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/organization-projects';

	async getExternalProjects(
		relations?: string[],
		options?: Partial<IOrganizationProject>
	): Promise<IOrganizationProject[]> {
		try {
			// ever-gauzy fork: one request per root relation (see fetchWithSplitRelations)
			return await fetchWithSplitRelations(
				relations ?? projectRelations,
				async (group) => {
					const projects: IPagination<IOrganizationProject> = (
						await this.apiFetch({
							method: 'GET',
							path: this.path,
							query: qs.stringify(
								getProjectsQuery(group, options)
							)
						})
					).data;

					return projects.items;
				}
			);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get all projects for a workspace
	 * @returns - A promise that resolves after getting all projects for a workspace
	 * @memberof ProjectService
	 */
	async getProjects(
		relations?: string[],
		memberReturnType: 'ids' | 'objects' = 'ids'
	): Promise<Partial<IProject>[]> {
		try {
			const projects = await this.getExternalProjects(relations);

			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					BaseEntityEnum.OrganizationProject
				);

			return getProjectsResponse(projects, favoriteIds, memberReturnType);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Retrieves the external projects associated with a specific employee by their ID.
	 * The method sends a GET request to the external API and processes the response to
	 * return a list of organization projects.
	 *
	 * @param {ID} employeeId - The unique identifier of the employee whose projects are to be retrieved.
	 * @returns {Promise<IOrganizationProject[]>} A promise that resolves with a list of organization projects.
	 *
	 * @throws {BadRequestException} If an error occurs during the API request or response handling.
	 */
	async getExternalProjectsByEmployee(
		employeeId: ID,
		relations?: string[]
	): Promise<IOrganizationProject[]> {
		try {
			const query = qs.stringify(findEmployeeProjectsQuery(relations));

			const projects: IOrganizationProject[] = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/employee/${employeeId}`,
					query
				})
			).data;

			return projects;
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Retrieves the projects associated with a specific employee by their ID.
	 * The method sends a GET request to the external API and processes the response to
	 * return a list of organization projects.
	 *
	 * @returns {Promise<IOrganizationProject[]>} A promise that resolves with a list of organization projects.
	 *
	 * @throws {BadRequestException} If an error occurs during the API request or response handling.
	 */
	async getEmployeeProjects(relations?: string[]): Promise<IProject[]> {
		try {
			const employeeProjects = await this.getExternalProjectsByEmployee(
				currentEmployeeId()!,
				relations
			);

			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					BaseEntityEnum.OrganizationProject
				);

			return getProjectsResponse(employeeProjects, favoriteIds);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}

	/**
	 * @description - Get remode API project
	 * @private
	 * @param {ID} id - The project ID
	 * @returns - A promise that resolved after getting project
	 * @memberof ProjectService
	 */
	async getExternalProject(
		id: ID,
		relations?: string[]
	): Promise<IOrganizationProject> {
		try {
			if (isEmpty(id)) {
				throw new BadRequestException(
					'Please provide the project ID to search'
				);
			}

			// ever-gauzy fork: one request per root relation (see fetchWithSplitRelations)
			const [project] = await fetchWithSplitRelations(
				relations ?? projectRelations,
				async (group) => [
					(
						await this.apiFetch({
							method: 'GET',
							path: `${this.path}/${id}`,
							query: qs.stringify(getProjectsQuery(group))
						})
					).data as IOrganizationProject
				]
			);
			return project;
		} catch (error: any) {
			throw new BadRequestException(error.message);
		}
	}

	/**
	 * @description - Get workspace project by ID
	 * @param {ID} id - The UUID primary key of the project to be fetched
	 * @returns - A promise that resolves after getting the project
	 * @memberof ProjectService
	 */
	async getProject(id: ID, relations?: string[]): Promise<IProject> {
		try {
			// ever-gauzy fork: the `tasks` relation was only loaded to count them (`total_issues`), and loading every
			// task of a big project is expensive, so count them instead
			const countTasks = !!relations?.some(
				(relation) => relation.split('.')[0] === 'tasks'
			);
			const [project, totalIssues] = await Promise.all([
				this.getExternalProject(
					id,
					countTasks
						? relations!.filter(
								(relation) => relation.split('.')[0] !== 'tasks'
							)
						: relations
				),
				countTasks ? this.countProjectTasks(id) : undefined
			]);

			if (!project) {
				throw new BadRequestException('Project not found');
			}

			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					BaseEntityEnum.OrganizationProject
				);

			const response = getProjectsResponse(
				[project],
				favoriteIds
			)[0] as IProject;

			if (totalIssues !== undefined) {
				response.total_issues = totalIssues;
			}

			return response;
		} catch (error: any) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * ever-gauzy fork: counts a project's tasks without loading them (one `id` column, one row; `total` is the count).
	 *
	 * @param {ID} id - The project ID
	 * @returns The number of tasks in the project
	 */
	private async countProjectTasks(id: ID): Promise<number> {
		const tasks: IPagination<{ id: ID }> = (
			await this.apiFetch({
				method: 'GET',
				path: '/tasks',
				query: qs.stringify({
					...baseGetItemsWhereQuery(),
					'where[projectId]': id,
					'select[id]': true,
					take: 1
				})
			})
		).data;

		return tasks.total;
	}

	/**
	 * @description - Get project members
	 * @param {ID} id - The UUID primary key of the project for whom to get members
	 * @returns - A promise that resolves after getting the project members
	 * @memberof ProjectService
	 */
	async getProjectMembers(id: ID): Promise<IGetProjectMembersResponse[]> {
		try {
			const project = await this.getExternalProject(id, [
				'members.employee.user.role',
				'members.role'
			]);
			const members = project.members;

			return (members ?? []).flatMap((member) => {
				// ever-gauzy fork: null-safe (hardening) — a member whose employee/user
				// relation is missing has no user ID, so it cannot be returned as a member.
				const id = typeof member !== 'string' ? member.employee?.user?.id || member.employee?.userId : undefined;
				if (typeof member === 'string' || !id) {
					return [];
				}
				return [
					{
						id,
						original_role: member.isManager ? 20 : 15,
						member: member.employeeId,
						role: member.isManager ? 20 : 15,
						created_at: member.createdAt,
						project: project.id
					}
				];
			}) as IGetProjectMembersResponse[];
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			return undefined as any;
		}
	}

	/**
	 * @description - Create new Project in workspace
	 * @param {CreateProjectDTO} input - input data with which to create project
	 * @returns - A promise that resolves after created project
	 * @memberof ProjectService
	 */
	async createOrganizationProject(
		input: ICreateProjectInput
	): Promise<IProject> {
		// Validate if the project identifier is already in use
		try {
			const projects = await this.getExternalProjects([], {
				code: input.identifier
			});

			if (projects.length > 0) {
				throw new BadRequestException({
					identifier: ['PROJECT_IDENTIFIER_ALREADY_EXIST']
				});
			}
		} catch (error) {
			if (error instanceof BadRequestException) {
				throw error;
			}
			return undefined as any;
		}

		// Construct the body request
		const body = createProjectInputTransformer(input);

		// Create the project
		try {
			const project: IOrganizationProject = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body
				})
			).data;

			return getProjectsResponse([project])[0] as IProject;
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * @description Update project
	 * @param {ID} id The project ID
	 * @param {IUpdateProjectInput} input Data to be updated
	 * @returns A promise that resolves after project updated
	 * @memberof ProjectService
	 */
	async update(id: ID, input: IUpdateProjectInput): Promise<IProject> {
		try {
			// Extract members from the input if provided. ever-gauzy fork: `estimate` is the project's "Estimates"
			// switch (an estimate id turns it on, null turns it off), stored in Gauzy's project settings below.
			const { members, estimate, ...restInput } = input;

			// Retrieve the project details from a remote source
			const project = await this.getExternalProject(id, ['members']);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			// ever-gauzy fork: the Estimates switch sends only `estimate`. Rewriting the project from the transformer
			// would also reset fields that were not sent (it defaults `public`, the managers, …), so only a PATCH with
			// other fields goes through the full update.
			const hasProjectChanges =
				members !== undefined || Object.keys(restInput).length > 0;

			let updatedProject: IOrganizationProject = project;

			if (hasProjectChanges) {
				// Transform the input using the transformer function
				const transformedInput =
					createProjectInputTransformer(restInput);

				// Destructure the project object to exclude 'members' and construct `projectWithoutMembers`. The
				// estimation switch is left out so this write cannot put back a stale value.
				const {
					members: existingMembers = [],
					isTaskSizeEstimationEnabled: _storedEstimation,
					...projectWithoutMembers
				} = project;

				// Assign existing members if new members are not provided
				const memberIds = members
					? assignMembersToProjectTransformer(members)
					: existingMembers.map((m) => m.employeeId);

				// Create the final body for the PUT request by merging objects
				const body = {
					...projectWithoutMembers,
					...transformedInput,
					memberIds
				};

				updatedProject = (
					await this.apiFetch({
						method: 'PUT',
						path: `${this.path}/${id}`,
						body: {
							...project,
							isTaskSizeEstimationEnabled: undefined,
							...body
						}
					})
				).data;
			}

			if (estimate !== undefined) {
				const settings = await this.updateTaskSizeEstimation(
					id,
					estimate !== null
				);
				updatedProject = {
					...updatedProject,
					isTaskSizeEstimationEnabled:
						settings?.isTaskSizeEstimationEnabled
				};
			}

			// Transform the response to match the expected IProject format
			return getProjectsResponse([updatedProject])[0] as IProject;
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadGatewayException(error);
		}
	}

	/**
	 * ever-gauzy fork: turns the project's task-size estimation (Plane's "Estimates") on or off through Gauzy's
	 * project settings. A Gauzy without the setting ignores it, and its answer then has no value, which the project
	 * transformer reads as on.
	 *
	 * @param {ID} id - The project.
	 * @param {boolean} enabled - Whether the project's tasks are estimated with its task sizes.
	 * @returns The project settings Gauzy answers.
	 */
	private async updateTaskSizeEstimation(
		id: ID,
		enabled: boolean
	): Promise<IOrganizationProject> {
		return (
			await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/setting/${id}`,
				body: {
					isTaskSizeEstimationEnabled: enabled,
					organizationId: getCurrentOrganizationSlug(),
					tenantId: currentTenantId()
				}
			})
		).data;
	}

	/**
	 * @description - Add other members to project
	 * @param {ID} id - The project ID
	 * @returns A promise resolved after members assigned to project
	 * @memberof ProjectService
	 */
	async assignMembersToProject(
		id: ID,
		input: IAssignMembersToProject
	): Promise<IProject> {
		try {
			const { members } = input;
			const managers = members.filter((member) => member.role === 20);
			const project = await this.getExternalProject(id);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			// Extract existing members and prepare `projectWithoutMembers`
			const { members: existingMembers = [], ...projectWithoutMembers } =
				project;

			// Extract existing managers and prepare `projectWithoutManagers`
			const existingManagers = existingMembers.filter(
				(member) => member.isManager
			);

			// Create a Set to eliminate duplicates and include new member IDs
			const memberIds = [
				...new Set([
					...assignMembersToProjectTransformer(members),
					...existingMembers.map((m) => m.employeeId)
				])
			];

			// Create a Set to eliminate duplicates and include new manager IDs
			const managerIds = [
				...new Set([
					...managers.map((m) => m.member_id),
					...existingManagers.map((m) => m.employeeId)
				])
			];

			const updatedProject = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body: { ...projectWithoutMembers, memberIds, managerIds }
				})
			).data;

			return getProjectsResponse([updatedProject])[0];
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Retrieves the workspace project member's information, including personal settings and preferences.
	 *
	 * This method fetches project details, member information, and member-specific settings (task views).
	 * It returns a comprehensive object combining these details.
	 *
	 * @param {ID} id - The identifier of the project to retrieve member details for.
	 * @returns {Promise<any>} A promise that resolves to the combined member and project information.
	 * @throws {BadRequestException} Throws an error if the operation fails.
	 */
	async getWorkspaceProjectMemberMe(id: ID): Promise<any> {
		try {
			const employeeId = currentEmployeeId();
			// Fetch project details with the tenant relationship
			const project = await this.getExternalProject(id, [
				'tenant',
				'members'
			]);

			// Retrieve current member information from the project
			// ever-gauzy fork: null-safe (hardening) — members may be undefined/empty
			const memberInfos = (project.members ?? []).find(
				(member) => member.employeeId === employeeId
			);

			if (!memberInfos) {
				throw new NotFoundException(
					'You are not a member of this project'
				);
			}

			// Construct and return the response object
			return {
				member: memberInfos.employeeId,
				role: memberInfos.isManager ? 20 : 15
			};
		} catch (error) {
			this.handleApiError(error);
		}
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication and User features
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get user properties workspace project
	 * @param {ID} id - The UUID primary key of the project for whom get properties
	 * @returns - A promise that resolves after getting the user properties
	 * @memberof WorkspaceService
	 */
	async getProjectUserProperties(id: ID): Promise<IUserViewProperties> {
		try {
			const memberSetting =
				await this._employeePropertiesService.findOneByOptions({
					employeeId: currentEmployeeId()!,
					entity: BaseEntityEnum.OrganizationProject,
					entityId: id,
					settingType: EmployeeSettingTypeEnum.TASK_VIEWS
				});
			if (!memberSetting) {
				throw new BadRequestException('User view properties not found');
			}
			return employeeSettingSerializer(memberSetting);
		} catch (error: any) {
			try {
				// Create new settings with default properties if none exist
				const moduleMemberSetting =
					await this._employeePropertiesService.create({
						entity: BaseEntityEnum.OrganizationProject,
						entityId: id,
						settingType: EmployeeSettingTypeEnum.TASK_VIEWS,
						data: MEMBER_DEFAULT_VIEW_PROPS,
						defaultData: MEMBER_DEFAULT_VIEW_PROPS,
						employee: { id: currentEmployeeId() ?? undefined },
						employeeId: currentEmployeeId()!
					});

				return employeeSettingSerializer(moduleMemberSetting);
			} catch (error) {
				this.logger.error(
					'Operation failed',
					error instanceof Error ? error.stack : String(error)
				);
				throw new BadRequestException(
					'Failed to find or create new view properties'
				);
			}
		}
	}

	/**
	 * Updates or creates user-specific project settings (task views).
	 *
	 * This method updates an existing `EmployeeSetting` if found, or creates a new one
	 * with the provided properties. The settings include filters, display filters, and display properties.
	 *
	 * @param {ID} id - The identifier of the project for which view settings need to be updated.
	 * @param {IUpdateUserPropertiesInput} input - The user properties to update.
	 * @returns {Promise<any>} A promise that resolves to the serialized employee settings.
	 * @throws {BadRequestException} Throws an error if the operation fails.
	 */
	async updateProjectUserProperties(
		id: ID,
		input: IUpdateUserPropertiesInput
	): Promise<any> {
		try {
			// ever-gauzy fork: one atomic, key-level save (see EmployeePropertiesService.saveViewProperties)
			const memberSetting =
				await this._employeePropertiesService.saveViewProperties(
					BaseEntityEnum.OrganizationProject,
					id,
					input
				);

			// Serialize and return the updated/created employee setting.
			return employeeSettingSerializer(memberSetting);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Deletes a project by its ID.
	 *
	 * Sends a DELETE request to the API using the provided project ID.
	 * If the request fails, it throws a BadRequestException with the original error.
	 *
	 * @param {ID} id - The unique identifier of the project to delete.
	 * @returns {Promise<any>} - The API response if the deletion is successful.
	 * @throws {BadRequestException} - Thrown if the API request fails.
	 */
	async delete(id: ID): Promise<any> {
		try {
			return (
				await this.apiFetch({
					path: `${this.path}/${id}`,
					method: 'DELETE'
				})
			).data;
		} catch (error) {
			this.handleApiError(error);
		}
	}
}
