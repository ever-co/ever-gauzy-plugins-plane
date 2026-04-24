import {
	BadRequestException,
	forwardRef,
	Inject,
	Injectable
} from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IOrganization,
	IPagination,
	IProjectDeployBoardResponse,
	IProjectDeployBoardsCreateInput,
	ISharedEntity,
	JsonData
} from '@ever-gauzy/plugin-integration-plane-models';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';
import {
	DEFAULT_PROJECT_DEPLOY_BOARDS_PROPERTIES,
	getCurrentOrganizationSlug,
	getSharedProjectQuery,
	isEmpty,
	projectDeployBoardsCreateInputTransformer,
	transformSharedEntityToDeployBoardResponse
} from '../../../config';
import { ProjectService } from '../project.service';

@Injectable()
export class ProjectDeployBoardsService extends ApiFetchService {
	constructor(
		@Inject(forwardRef(() => ProjectService))
		private readonly _projectService: ProjectService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

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

			return isEmpty(sharedProject.items[0]?.sharedOptions)
				? DEFAULT_PROJECT_DEPLOY_BOARDS_PROPERTIES
				: sharedProject.items[0]?.sharedOptions as JsonData;
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Get the current workspace/organization details
	 * @returns The organization details
	 */
	private async getWorkspaceDetails(): Promise<IOrganization> {
		try {
			const organization: IOrganization = (
				await this.apiFetch({
					method: 'GET',
					path: `/organization/${getCurrentOrganizationSlug()}`
				})
			).data;

			return organization;
		} catch (error: any) {
			throw new BadRequestException(
				'Failed to retrieve workspace details'
			);
		}
	}

	/**
	 * Publish the project deploy boards
	 * @param projectId - The ID of the project
	 * @param input - The project deploy boards create input
	 * @returns The deploy board response in Plane format
	 */
	async create(
		projectId: ID,
		input: IProjectDeployBoardsCreateInput
	): Promise<IProjectDeployBoardResponse> {
		try {
			// Create the shared entity input
			const sharedEntityCreateInput =
				projectDeployBoardsCreateInputTransformer(projectId, input);

			// Create the shared entity
			const sharedEntity: ISharedEntity = (
				await this.apiFetch({
					method: 'POST',
					path: `${this.path}`,
					body: sharedEntityCreateInput
				})
			).data;

			// Get project and workspace details for the response
			const [project, workspace] = await Promise.all([
				this._projectService.getExternalProject(projectId),
				this.getWorkspaceDetails()
			]);

			// Transform to Plane's expected format
			return transformSharedEntityToDeployBoardResponse(
				sharedEntity,
				project,
				workspace.profile_link || getCurrentOrganizationSlug(),
				workspace.name!,
				workspace.id!
			);
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Get the shared entity by token
	 * @param token - The token of the shared entity
	 * @returns The shared entity
	 */
	async getSharedEntityByToken(token: string): Promise<ISharedEntity> {
		try {
			const sharedEntity: ISharedEntity = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/token/${token}`
				})
			).data;

			return sharedEntity;
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}
}
