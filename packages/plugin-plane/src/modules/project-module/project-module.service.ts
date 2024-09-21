import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
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
} from '../../config/serializers/modules/module.response';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class ProjectModuleService extends ApiFetchService {
	constructor(private readonly _serverFetchService: ApiFetchService) {
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
			const body = createModuleInputTransformer(payload);

			const projectModule: IOrganizationProjectModule = (
				await this.apiFetch({ method: 'POST', path: this.path, body })
			).data;

			return modulesTransformer(projectModule);
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
			const modules: IPagination<IOrganizationProjectModule> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query,
				})
			).data;

			return modulesTransformer(modules.items);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException();
		}
	}
}
