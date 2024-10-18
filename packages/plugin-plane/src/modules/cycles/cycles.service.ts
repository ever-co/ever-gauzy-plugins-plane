import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable,
} from '@nestjs/common';
import qs from 'qs';
import {
	BaseEntityEnum,
	ICycle,
	ID,
	IOrganizationSprint,
} from '@plane-plugin/models';
import {
	createCycleInputTransformer,
	cycleTransformer,
	getSprintsQuery,
	updateCycleInputTransformer,
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { ProjectService } from '../project/project.service';
import { UserFavoritesService } from '../user-favorites/user-favorites.service';

@Injectable()
export class CyclesService extends ApiFetchService {
	constructor(
		private readonly _serverFetchService: ApiFetchService,

		@Inject(forwardRef(() => UserFavoritesService))
		private readonly _userFavoriteService: UserFavoritesService,

		@Inject(forwardRef(() => ProjectService))
		private readonly _projectService: ProjectService,
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/organization-sprint';

	/**
	 * @description Find a sprint from external API
	 * @param {ID} id - The sprint ID to find
	 * @param {ID} [projectId] - Optional Project ID to filter search
	 * @returns {Promise<IOrganizationSprint>} - A promise resolved to found Sprint
	 * @memberof CyclesService
	 */
	async getExternalSprint(
		id: ID,
		projectId?: ID,
	): Promise<IOrganizationSprint> {
		// Build the query string once
		const query = qs.stringify(getSprintsQuery(projectId));

		return await (
			await this.apiFetch({
				method: 'GET',
				path: `${this.path}/${id}`,
				query,
			})
		).data;
	}

	/**
	 * Creates a new cycle and returns the transformed cycle or cycles.
	 *
	 * @param {ICycle} input - The cycle data used to create a new cycle.
	 * @returns {Promise<ICycle | ICycle[]>} - The created cycle or a list of cycles after transformation.
	 * @throws {BadRequestException} - Throws an error if the creation fails.
	 */
	async create(input: ICycle): Promise<ICycle | ICycle[]> {
		try {
			// Build the body request
			const body = createCycleInputTransformer(input);

			const sprint: IOrganizationSprint = (
				await this.apiFetch({ method: 'POST', path: this.path, body })
			).data;

			// Return the transformed sprint
			return cycleTransformer(sprint);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Updates an existing cycle by its ID and returns the transformed cycle or cycles.
	 *
	 * @param {ID} id - The unique identifier of the cycle to update.
	 * @param {ICycle} input - The updated cycle data.
	 * @returns {Promise<ICycle | ICycle[]>} - The updated cycle or a list of updated cycles after transformation.
	 * @throws {BadRequestException} - Throws an error if the update fails.
	 */
	async update(id: ID, input: ICycle): Promise<ICycle | ICycle[]> {
		try {
			// Build the body request
			const body = updateCycleInputTransformer(input);

			const sprint: IOrganizationSprint = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body,
				})
			).data;

			const favoriteIds =
				await this._userFavoriteService.findEmployeeFavoriteEntityIds(
					BaseEntityEnum.OrganizationSprint,
				);

			return cycleTransformer(sprint, favoriteIds);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error.response);
		}
	}
}
