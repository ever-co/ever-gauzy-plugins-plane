import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	IOrganizationProject,
	IPagination,
	IProjectIdentifierResponse
} from '@ever-gauzy/plugin-integration-plane-models';
import { getProjectByIdentifiersQuery } from '../../../config';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';

@Injectable()
export class ProjectIdentifiersService extends ApiFetchService {
	constructor(private readonly _serverFetchService: ApiFetchService) {
		super(_serverFetchService['_httpService']);
	}

	private path = '/organization-projects';

	/**
	 * @description - Get all projects by code / identifier
	 * @param {string} identifier identifier for filtering
	 * @returns - A promise that resolves after getting projects
	 * @memberof ProjectIdentifiersService
	 */
	async getProjectsByCode(
		identifier: string
	): Promise<IProjectIdentifierResponse> {
		try {
			const query = qs.stringify(
				getProjectByIdentifiersQuery(identifier)
			);

			const projects: IPagination<IOrganizationProject> = (
				await this.apiFetch({ method: 'GET', path: this.path, query })
			).data;

			if (projects.items.length > 0) {
				const identifiers = projects.items.map((project, id) => ({
					id,
					name: project.code!.toLocaleUpperCase(),
					project: project.id
				}));
				return {
					exists: 1,
					identifiers
				};
			}

			return { exists: 0, identifiers: [] };
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(error);
		}
	}
}
