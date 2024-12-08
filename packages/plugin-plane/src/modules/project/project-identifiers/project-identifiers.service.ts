import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	IOrganizationProject,
	IPagination,
	IProjectIdentifierResponse
} from '@plane-plugin/models';
import { getProjectByIdentifiersQuery } from '../../../config';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';

@Injectable()
export class ProjectIdentifiersService extends ApiFetchService {
	constructor(private readonly _serverFetchService: ApiFetchService) {
		super(_serverFetchService['_httpService']);
	}

	private path = '/organization-projects';

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication
	 *--------------------------------------------------------------*/
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
					name: project.code.toLocaleUpperCase(),
					project: project.id
				}));
				return {
					exists: 1,
					identifiers
				};
			}

			return { exists: 0, identifiers: [] };
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
