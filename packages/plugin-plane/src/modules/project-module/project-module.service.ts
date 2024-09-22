import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ICreateModuleInput,
	ID,
	IEmployee,
	IModule,
	IOrganizationProjectModule,
	IPagination,
} from '@plane-plugin/models';
import {
	createModuleInputTransformer,
	getModulesQuery,
	modulesTransformer,
} from '../../config/serializers/modules/module.response';
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
	 * @param {ICreateModuleInput} payload - data for creating new module
	 * @returns - A promise that resolves after module created
	 * @memberof ProjectModuleService
	 */
	async create(payload: ICreateModuleInput): Promise<IModule | IModule[]> {
		try {
			const project = await this._projectService.getRemoteProject(
				payload.project_id,
			);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			let lead: IEmployee | undefined;

			if (payload.lead_id) {
				lead = project.members.find(
					(employee) => employee.id === payload.lead_id,
				);
			}

			const body = createModuleInputTransformer(
				payload,
				lead && lead.userId,
			);

			const projectModule: IOrganizationProjectModule = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body,
				})
			).data;

			return modulesTransformer(projectModule, lead && lead.id);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Get project modules
	 * @param {ID} projectId - The project ID for whom search modules
	 * @returns A promise that resolves after getting modukes
	 * @memberof ProjectModuleService
	 */
	async getAllModulesByProject(projectId: ID) {
		try {
			const query = qs.stringify(getModulesQuery(projectId));

			const project =
				await this._projectService.getRemoteProject(projectId);

			if (!project) {
				throw new BadRequestException('Project could not be found');
			}

			const modules: IPagination<IOrganizationProjectModule> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query,
				})
			).data;

			modules.items.forEach((module) => {
				const lead = project.members.find(
					(employee) => employee.userId === module.managerId,
				);
				return {
					...module,
					managerId: lead?.id,
				};
			});

			return modulesTransformer(modules.items);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException();
		}
	}
}
