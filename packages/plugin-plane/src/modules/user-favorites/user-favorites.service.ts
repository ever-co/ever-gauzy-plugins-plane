import { BadRequestException, Injectable } from '@nestjs/common';
import {
	FavoriteEntityTypeEnum,
	ICreateFavoriteInput,
	ID,
	IFavorite,
	IFavoriteData,
} from '@plane-plugin/models';
import {
	createFavoriteInputTransformer,
	defaultOrganizationId,
	favoriteTransformer,
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { ProjectService } from '../project/project.service';
import { ProjectModuleService } from '../project-module/project-module.service';

@Injectable()
export class UserFavoritesService extends ApiFetchService {
	private readonly path = '/favorite';

	constructor(
		private readonly _serverFetchService: ApiFetchService,
		private readonly _projectService: ProjectService,
		private readonly _projectModuleService: ProjectModuleService,
		// TODO : Add here Cycle service also
	) {
		super(_serverFetchService['_httpService']);
	}

	/**
	 * @description Add element as favorite
	 * @param {ICreateFavoriteInput} input - Body Request data for creating favorites
	 * @returns A promise resolved to created favorite
	 * @memberof UserFavoritesService
	 */
	async create(input: ICreateFavoriteInput): Promise<IFavoriteData> {
		try {
			// Destructuring input and preparing request body
			const { entity_identifier, entity_type, project_id } = input;
			const body = {
				...createFavoriteInputTransformer(input),
				organizationId: defaultOrganizationId,
			};

			// Create the favorite entity
			const favorite: IFavorite = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body,
				})
			).data;

			// Retrieve associated entity data based on the entity type using a service map
			const entityServiceMap = {
				[FavoriteEntityTypeEnum.MODULE]: () =>
					this._projectModuleService.getModule(
						entity_identifier,
						project_id,
					),
				[FavoriteEntityTypeEnum.PROJECT]: () =>
					this._projectService.getProject(project_id),

				// TODO : Find Cycle here after cycle integration
			};

			// Retrieve entity data if available
			const entityData = entityServiceMap[entity_type]
				? await entityServiceMap[entity_type]()
				: undefined;

			// Transform and return the favorite data with associated entity details
			return favoriteTransformer(favorite, {
				...entityData,
				projectId:
					entity_type === FavoriteEntityTypeEnum.PROJECT
						? entityData.id
						: entityData.project_id,
			});
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Delete element from favorites
	 * @param {ID} id - The ID of favorite to be deleted
	 * @returns - A promise resolved after favorite deleted
	 * @memberof UserFavoritesService
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
