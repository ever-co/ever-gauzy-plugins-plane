import { BadRequestException, Injectable } from '@nestjs/common';
import {
	ICreateModuleInput,
	IModule,
	IOrganizationProjectModule,
} from '@plane-plugin/models';
import {
	createModuleInputTransformer,
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
}
