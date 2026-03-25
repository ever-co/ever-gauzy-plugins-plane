import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable
} from '@nestjs/common';
import qs from 'qs';
import {
	BaseEntityEnum,
	EmployeeSettingTypeEnum,
	ICreateModuleInput,
	ID,
	IModule,
	IOrganizationProjectModule,
	IPagination,
	IUpdateUserPropertiesInput,
	IUserViewProperties
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	createModuleInputTransformer,
	currentEmployeeId,
	employeeSettingSerializer,
	getModulesQuery,
	MEMBER_DEFAULT_VIEW_PROPS,
	modulesTransformer
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { ProjectService } from '../project/project.service';
import { UserFavoritesService } from '../user-favorites/user-favorites.service';
import { EmployeePropertiesService } from '../employee-properties/employee-properties.service';

@Injectable()
export class ProjectModuleService extends ApiFetchService {
	constructor(
		private readonly _serverFetchService: ApiFetchService,

		@Inject(forwardRef(() => UserFavoritesService))
		private readonly _userFavoriteService: UserFavoritesService,

		@Inject(forwardRef(() => ProjectService))
		private readonly _projectService: ProjectService,

		private readonly _employeePropertiesService: EmployeePropertiesService
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/organization-project-modules';

	async getExternalModule(
		id: ID,
		projectId?: ID,
		relations?: string[]
	): Promise<IOrganizationProjectModule> {
		// Construct the query string once
		const query = qs.stringify(getModulesQuery(projectId, relations));

		return (
			await this.apiFetch({
				method: 'GET',
				path: `${this.path}/${id}`,
				query
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
			// Transform input data for creating a module, assigning the correct manager's userId
			const body = createModuleInputTransformer(input, input.lead_id);

			const projectModule: IOrganizationProjectModule = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body
				})
			).data;

			// Return the transformed module, including the managerId if lead is found
			return modulesTransformer(projectModule, []);
		} catch (error: any) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Get project modules
	 * @param {ID} projectId - The project ID for whom search modules
	 * @returns A promise that resolves after getting modules
	 * @memberof ProjectModuleService
	 */
	async getAllModulesByProject(projectId?: ID) {
		try {
			// Build the query string once
			const query = qs.stringify(
				getModulesQuery(projectId, ['members.employee', 'tasks.members', 'tasks.tags'])
			);

			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					BaseEntityEnum.OrganizationProjectModule
				);

			// Perform the API call to fetch the modules
			const modules: IPagination<IOrganizationProjectModule> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query
				})
			).data;

			// Return the transformed modules
			return modulesTransformer(modules.items, favoriteIds);
		} catch (error: any) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
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
			const module = await this.getExternalModule(id, projectId, [
				'members.employee', 'members.employee', 'tasks.members', 'tasks.tags'
			]);

			// Favorites
			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					BaseEntityEnum.OrganizationProjectModule
				);

			// Return the transformed module using `modulesTransformer`
			return modulesTransformer(module, favoriteIds);
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
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
		input: Partial<ICreateModuleInput>
	): Promise<IModule | IModule[]> {
		try {
			// Retrieve the project and check its existence
			const project = await this._projectService.getExternalProject(
				input.project_id || projectId,
				['members.employee']
			);
			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			// Retrieve the existing module to ensure it exists
			const existingModule = await this.getExternalModule(id, project.id);

			if (!existingModule) {
				throw new BadRequestException(
					`Module with id ${id} could not be found`
				);
			}

			// Identify the lead (manager) if lead_id is provided in input
			const lead = input.lead_id
				? project.members!.find(
						(member) => member.employee!.id === input.lead_id
					)
				: undefined;

			// Transform the update input for API compatibility, using the correct managerId (userId)
			const body = createModuleInputTransformer(
				{ ...input },
				lead?.employeeId
			);

			// Update the module using a PATCH request
			await this.apiFetch({
				method: 'PUT',
				path: `${this.path}/${id}`,
				body: { ...existingModule, ...body }
			});

			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					BaseEntityEnum.OrganizationProjectModule
				);

			const module = await this.getExternalModule(id);

			// Return the updated module, with managerId set to employeeId instead of userId
			return modulesTransformer(module, favoriteIds);
		} catch (error) {
			// Log the error and throw a BadRequestException
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
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
				path: `${this.path}/${id}/soft`
			})
		).data;
	}

	/**
	 * @description Get user modules properties
	 * @param {ID} id - Module ID of module for whom get properties
	 * @returns A promise resolved to user properties
	 * @memberof ProjectModuleService
	 */
	async getModuleUserProperties(id: ID) {
		try {
			const memberSetting =
				await this._employeePropertiesService.findOneByOptions({
					employeeId: currentEmployeeId()!,
					entity: BaseEntityEnum.OrganizationProjectModule,
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
						entity: BaseEntityEnum.OrganizationProjectModule,
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
	 * @description Update Module User properties
	 * @param {ID} id - Module ID of module for whom update properties
	 * @param {IUpdateUserPropertiesInput} input - The updated properties input
	 * @returns A promise resolved to updated user properties
	 * @memberof ProjectModuleService
	 */
	async updateModuleUserProperties(
		id: ID,
		input: IUpdateUserPropertiesInput
	): Promise<IUserViewProperties> {
		try {
			// Destructure input properties for clarity
			const {
				display_filters,
				display_properties,
				filters,
				rich_filters
			} = input;

			// Find existing employee settings for the given project module
			let memberSetting =
				await this._employeePropertiesService.findOneByOptions({
					employeeId: currentEmployeeId()!,
					entity: BaseEntityEnum.OrganizationProjectModule,
					entityId: id,
					settingType: EmployeeSettingTypeEnum.TASK_VIEWS
				});

			if (memberSetting) {
				// Update the existing settings with new data or fallback to existing data
				const data: Record<string, any> = memberSetting.data as Record<
					string,
					any
				>;
				memberSetting = await this._employeePropertiesService.update(
					memberSetting.id!,
					{
						...memberSetting,
						data: {
							filters: filters ? filters : data.filters,
							rich_filters: rich_filters
								? rich_filters
								: data.rich_filters,
							display_filters: display_filters
								? display_filters
								: data.display_filters,
							display_properties: display_properties
								? display_properties
								: data.display_properties
						}
					}
				);
			} else {
				// Create new settings with default properties if none exist
				memberSetting = await this._employeePropertiesService.create({
					entity: BaseEntityEnum.OrganizationProjectModule,
					entityId: id,
					settingType: EmployeeSettingTypeEnum.TASK_VIEWS,
					data: MEMBER_DEFAULT_VIEW_PROPS,
					defaultData: MEMBER_DEFAULT_VIEW_PROPS,
					employee: { id: currentEmployeeId() ?? undefined },
					employeeId: currentEmployeeId()!
				});
			}
			// Serialize and return the updated/created employee setting.
			return employeeSettingSerializer(memberSetting);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}
}
