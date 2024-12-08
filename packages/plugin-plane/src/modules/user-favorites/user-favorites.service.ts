import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable
} from '@nestjs/common';
import qs from 'qs';
import {
	BaseEntityEnum,
	FavoriteEntityTypeEnum,
	ICreateFavoriteInput,
	ID,
	IFavorite,
	IFavoriteData,
	IPagination
} from '@plane-plugin/models';
import {
	apiFavoriteEntityToProxy,
	createFavoriteInputTransformer,
	defaultOrganizationId,
	favoriteTransformer,
	getFavoriteQuery,
	modulesTransformer
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { ProjectService } from '../project/project.service';
import { ProjectModuleService } from '../project-module/project-module.service';
import { IssueViewService } from '../views/view.service';
import { CyclesService } from '../cycles/cycles.service';

@Injectable()
export class UserFavoritesService extends ApiFetchService {
	private readonly path = '/favorite';

	constructor(
		private readonly _serverFetchService: ApiFetchService,
		private readonly _projectModuleService: ProjectModuleService,
		@Inject(forwardRef(() => ProjectService))
		private readonly _projectService: ProjectService,
		private readonly _issueViewService: IssueViewService,
		private readonly _cycleService: CyclesService
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
				organizationId: defaultOrganizationId()
			};

			// Create the favorite entity
			const favorite: IFavorite = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body
				})
			).data;

			// Retrieve associated entity data based on the entity type using a service map
			const entityServiceMap = {
				[FavoriteEntityTypeEnum.MODULE]: () =>
					this._projectModuleService.getModule(
						entity_identifier,
						project_id
					),

				[FavoriteEntityTypeEnum.PROJECT]: () =>
					this._projectService.getProject(project_id, []),

				[FavoriteEntityTypeEnum.VIEW]: () =>
					this._issueViewService.findOne(entity_identifier),

				[FavoriteEntityTypeEnum.CYCLE]: () =>
					this._cycleService.findOne(entity_identifier, project_id)
			};

			// Retrieve entity data if available
			const entityData: any = entityServiceMap[entity_type]
				? await entityServiceMap[entity_type]()
				: undefined;

			// Transform and return the favorite data with associated entity details
			return favoriteTransformer(favorite, {
				...entityData,
				projectId:
					entity_type === FavoriteEntityTypeEnum.PROJECT
						? entityData.id
						: entityData.project_id || entityData.project
			});
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Find employee favorites
	 * @returns  A promise resolved to transformed favorites
	 * @memberof UserFavoritesService
	 */
	async findEmployeeFavorites(): Promise<IFavoriteData[]> {
		try {
			const query = qs.stringify(getFavoriteQuery());
			// Retrieve all favorites
			const favorites: IPagination<IFavorite> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/employee`,
					query
				})
			).data;
			const favoritesItems = favorites.items;

			// Retrieve favorites related data
			const enrichedFavorites = await Promise.all(
				favoritesItems.map(async (favorite) => {
					const entityType = apiFavoriteEntityToProxy(
						favorite.entity
					);
					let entityData: any = null;

					// Check the entity type and Get related data
					switch (entityType) {
						case FavoriteEntityTypeEnum.MODULE:
							const module = modulesTransformer(
								await this._projectModuleService.getExternalModule(
									favorite.entityId,
									null,
									['creator']
								)
							);
							entityData = module;
							break;

						case FavoriteEntityTypeEnum.PROJECT:
							entityData = await this._projectService.getProject(
								favorite.entityId,
								['members']
							);
							break;

						case FavoriteEntityTypeEnum.VIEW:
							entityData =
								await this._issueViewService.getExternalView(
									favorite.entityId,
									null,
									['project']
								);
							break;

						case FavoriteEntityTypeEnum.CYCLE:
							entityData =
								await this._cycleService.getExternalSprint(
									favorite.entityId,
									null,
									['project']
								);
							break;

						default:
							entityData = null;
							break;
					}
					return favoriteTransformer(favorite, {
						...entityData,
						projectId:
							entityType === FavoriteEntityTypeEnum.PROJECT
								? entityData.id
								: entityData?.project_id || null
					});
				})
			);

			// Return transformed favorites
			return enrichedFavorites;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error);
		}
	}

	async findEmployeeFavoriteEntityIds(entity: BaseEntityEnum) {
		const query = qs.stringify(getFavoriteQuery({ entity }));
		try {
			const favorites: IPagination<IFavorite> = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/employee`,
					query
				})
			).data;

			return favorites.items.map((favorite) => favorite.entityId);
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
		try {
			const deleted = (
				await this.apiFetch({
					method: 'DELETE',
					path: `${this.path}/${id}`
				})
			).data;

			return deleted;
		} catch (error) {
			console.log(error);
		}
	}
}
