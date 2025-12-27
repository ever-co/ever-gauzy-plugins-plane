import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IPagination,
	IProjectDeployBoardsCreateInput,
	ISharedEntity,
	JsonData
} from '@plane-plugin/models';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';
import {
	DEFAULT_PROJECT_DEPLOY_BOARDS_PROPERTIES,
	getSharedProjectQuery,
	isEmpty,
	projectDeployBoardsCreateInputTransformer
} from '../../../config';

@Injectable()
export class ProjectDeployBoardsService extends ApiFetchService {
	private readonly path = '/shared-entities';

	/**
	 * Get the project deploy boards
	 * @param projectId - The ID of the project
	 * @returns The project deploy boards shared options
	 */
	async getProjectDeployBoards(projectId: ID): Promise<JsonData> {
		try {
			const query = qs.stringify(getSharedProjectQuery(projectId));
			const sharedProject: IPagination<ISharedEntity> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}`,
					query
				})
			).data;

			console.log({ sharedProject });

			return isEmpty(sharedProject.items[0]?.sharedOptions)
				? DEFAULT_PROJECT_DEPLOY_BOARDS_PROPERTIES
				: sharedProject.items[0]?.sharedOptions;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Publish the project deploy boards
	 * @param projectId - The ID of the project
	 * @param input - The project deploy boards create input
	 * @returns The shared entity
	 */
	async create(
		projectId: ID,
		input: IProjectDeployBoardsCreateInput
	): Promise<any> {
		try {
			const sharedEntityCreateInput =
				projectDeployBoardsCreateInputTransformer(projectId, input);

			const sharedEntity: ISharedEntity = (
				await this.apiFetch({
					method: 'POST',
					path: `${this.path}`,
					body: sharedEntityCreateInput
				})
			).data;

			console.log({ sharedEntity });

			return sharedEntity;
		} catch (error: any) {
			console.log(error.response.data);
			throw new BadRequestException(error);
		}
	}
}
