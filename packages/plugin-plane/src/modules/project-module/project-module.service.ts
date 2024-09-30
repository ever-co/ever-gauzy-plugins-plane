import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ICreateModuleInput,
	ID,
	IModule,
	IOrganizationProjectEmployee,
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

@Injectable()
export class ProjectModuleService extends ApiFetchService {
	constructor(
		private readonly _serverFetchService: ApiFetchService,
		private readonly _projectService: ProjectService,
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/organization-project-modules';

	/**
	 * @description - Create module
	 * @param {ICreateModuleInput} input - data for creating new module
	 * @returns - A promise that resolves after module created
	 * @memberof ProjectModuleService
	 */
	async create(input: ICreateModuleInput): Promise<IModule | IModule[]> {
		try {
			const project = await this._projectService.getRemoteProject(
				input.project_id,
			);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			let lead: IOrganizationProjectEmployee | undefined;

			if (input.lead_id) {
				lead = project.members.find(
					(member) => member.employee.id === input.lead_id,
				);
			}

			const body = createModuleInputTransformer(
				input,
				lead.employee.userId,
			);

			const projectModule: IOrganizationProjectModule = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body,
				})
			).data;

			console.log({ projectModule });

			return modulesTransformer(projectModule, lead && lead.id);
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
				await this._projectService.getRemoteProject(projectId);

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

			console.log({ memberMap });

			return modulesTransformer(modulesWithManagers);
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
			const query = qs.stringify(getModulesQuery(projectId));

			const project =
				await this._projectService.getRemoteProject(projectId);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			const module: IOrganizationProjectModule = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/${id}`,
					query,
				})
			).data;

			const lead = project.members.find(
				(member) => member.employee.userId === module.managerId,
			);
			const managerId = (module.managerId = lead?.employeeId);

			return modulesTransformer({ ...module, managerId });
		} catch (error) {
			console.log(error);
			throw new BadRequestException();
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
}
