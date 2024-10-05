import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
} from '@nestjs/common';
import qs from 'qs';
import {
	FavoriteEntityEnum,
	ICreateModuleInput,
	ID,
	IModule,
	IOrganizationProjectModule,
	IPagination,
} from '@plane-plugin/models';
import {
	createModuleInputTransformer,
	getModulesQuery,
	modulesTransformer,
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { ProjectService } from '../project/project.service';
import { UserFavoritesService } from '../user-favorites/user-favorites.service';

@Injectable()
export class ProjectModuleService extends ApiFetchService {
	constructor(
		private readonly _serverFetchService: ApiFetchService,
		@Inject(forwardRef(() => UserFavoritesService))
		private readonly _userFavoriteService: UserFavoritesService,
		@Inject(forwardRef(() => ProjectService))
		private readonly _projectService: ProjectService,
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/organization-project-modules';

	async getExternalModule(
		id: ID,
		projectId?: ID,
	): Promise<IOrganizationProjectModule> {
		// Construct the query string once
		const query = qs.stringify(getModulesQuery(projectId));

		return (
			await this.apiFetch({
				method: 'GET',
				path: `${this.path}/${id}`,
				query,
			})
		).data;
	}

	/**
	 * @description - Create module
	 * @param {ICreateModuleInput} input - data for creating new module
	 * @returns - A promise that resolves after module created
	 * @memberof ProjectModuleService
	 */
	async create(input: ICreateModuleInput): Promise<IModule | IModule[]> {
		try {
			// Fetch the project to ensure it exists and get its members
			const project = await this._projectService.getExternalProject(
				input.project_id,
			);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			// Find the lead (manager) in the project members based on the input lead_id
			const lead = input.lead_id
				? project.members.find(
						(member) => member.employee.id === input.lead_id,
					)
				: undefined;

			// Transform input data for creating a module, assigning the correct manager's userId
			const body = createModuleInputTransformer(
				input,
				lead?.employee.userId,
			);

			const projectModule: IOrganizationProjectModule = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body,
				})
			).data;

			// Return the transformed module, including the managerId if lead is found
			return modulesTransformer(projectModule, [], lead?.employeeId);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Get project modules
	 * @param {ID} projectId - The project ID for whom search modules
	 * @returns A promise that resolves after getting modules
	 * @memberof ProjectModuleService
	 */
	async getAllModulesByProject(projectId: ID) {
		try {
			// Build the query string once
			const query = qs.stringify(getModulesQuery(projectId));

			// Retrieve the project information
			const project =
				await this._projectService.getExternalProject(projectId);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			// Create a Map for quick access to employees by `userId`
			const memberMap = new Map(
				project.members.map((member) => [
					member.employee.userId,
					member.employeeId,
				]),
			);

			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					FavoriteEntityEnum.OrganizationProjectModule,
				);

			// Perform the API call to fetch the modules
			const modules: IPagination<IOrganizationProjectModule> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query,
				})
			).data;

			// Transform modules and link them to the corresponding managers
			const modulesWithManagers = modules.items.map((module) => ({
				...module,
				managerId: memberMap.get(module.managerId),
			}));

			// Return the transformed modules
			return modulesTransformer(modulesWithManagers, favoriteIds);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException();
		}
	}
	/**
	 * @description - Get project module
	 * @param {ID} id - The module ID to search
	 * @param {ID} projectId - The project ID filter condition
	 * @returns A promise that resolves after getting module
	 * @memberof ProjectModuleService
	 */
	async getModule(id: ID, projectId: ID) {
		try {
			// Retrieve the project data
			const project =
				await this._projectService.getExternalProject(projectId);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			// Build a Map for quick employee lookup using `userId`
			const memberMap = new Map(
				project.members.map((member) => [
					member.employee.userId,
					member.employeeId,
				]),
			);

			const module = await this.getExternalModule(id, projectId);

			// Favorites
			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					FavoriteEntityEnum.OrganizationProjectModule,
				);

			// Transform the module with the correct `managerId`
			const managerId = memberMap.get(module.managerId);

			// Return the transformed module using `modulesTransformer`
			return modulesTransformer({ ...module, managerId }, favoriteIds);
		} catch (error) {
			console.log(error);
			throw new BadRequestException();
		}
	}

	/**
	 * @description Update Project Module
	 * @param {ID} id Project Module ID to be updated
	 * @param {ICreateModuleInput} input Body Request data
	 * @returns A promise resolved to updated Module
	 * @memberof ProjectModuleService
	 */
	async update(
		id: ID,
		projectId: ID,
		input: Partial<ICreateModuleInput>,
	): Promise<IModule | IModule[]> {
		try {
			// Retrieve the project and check its existence
			const project = await this._projectService.getExternalProject(
				input.project_id || projectId,
			);
			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			// Retrieve the existing module to ensure it exists
			const existingModule = await this.getExternalModule(id, project.id);

			if (!existingModule) {
				throw new BadRequestException(
					`Module with id ${id} could not be found`,
				);
			}

			// Identify the lead (manager) if lead_id is provided in input
			const lead = input.lead_id
				? project.members.find(
						(member) => member.employee.id === input.lead_id,
					)
				: undefined;

			// Transform the update input for API compatibility, using the correct managerId (userId)
			const body = createModuleInputTransformer(
				input,
				lead?.employee.userId,
			);

			// Update the module using a PATCH request
			await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body,
			});

			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					FavoriteEntityEnum.OrganizationProjectModule,
				);

			const module = await this.getExternalModule(id);

			// Return the updated module, with managerId set to employeeId instead of userId
			return modulesTransformer(module, favoriteIds, lead?.employeeId);
		} catch (error) {
			// Log the error and throw a BadRequestException
			console.error(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Delete project module
	 * @param {ID} id - The project module to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof ProjectModuleService
	 */
	async delete(id: ID): Promise<any> {
		return (
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${id}`,
			})
		).data;
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication and User features
	 *--------------------------------------------------------------*/
	/**
	 * @description Get user modules properties
	 * @param {ID} id - Module ID of module for whom get properties
	 * @param {ID} projectId - Project ID of module for whom get properties
	 * @returns A promise resolved to user properties
	 * @memberof ProjectModuleService
	 */
	async getModuleUserProperties(id: ID, projectId: ID) {
		return {
			id: '8777de06-fab5-4888-8a8d-d860f91eba2d',
			created_at: '2024-08-20T14:27:11.217949Z',
			updated_at: '2024-08-23T06:33:05.401050Z',
			deleted_at: null,
			filters: {
				state: null,
				labels: null,
				priority: null,
				assignees: null,
				created_by: null,
				start_date: null,
				subscriber: null,
				state_group: null,
				target_date: null,
			},
			display_filters: {
				type: null,
				layout: 'kanban',
				calendar: {
					layout: 'month',
					show_weekends: false,
				},
				group_by: 'state',
				order_by: '-created_at',
				sub_issue: true,
				sub_group_by: null,
				show_empty_groups: true,
			},
			display_properties: {
				key: true,
				link: true,
				state: true,
				labels: true,
				assignee: true,
				due_date: true,
				estimate: true,
				priority: true,
				created_on: true,
				start_date: true,
				updated_on: true,
				sub_issue_count: true,
				attachment_count: true,
			},
			created_by: 'b7165202-4fcb-4351-b6c6-a2ce299ea10b',
			updated_by: 'b7165202-4fcb-4351-b6c6-a2ce299ea10b',
			project: projectId,
			module: id,
			workspace: 'f8468b87-c371-4a78-9d68-5d09abc221d2',
			user: 'b7165202-4fcb-4351-b6c6-a2ce299ea10b',
		};
	}
}
