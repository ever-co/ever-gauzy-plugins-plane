import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { ICreateWorkSpace } from '@ever-gauzy/plugin-integration-plane-models';
import {
	createOrganizationInputTransformer,
	workspaceTransformer
} from '../../config';

@Injectable()
export class WorkspacesService extends ApiFetchService {
	constructor(private readonly _serverFetchService: ApiFetchService) {
		super(_serverFetchService['_httpService']);
	}

	// The main endpoint for workspaces is the organization
	private readonly path = '/organization';

	/**
	 * Creates a new workspace by transforming input data and sending it to the API.
	 *
	 * @param data - The workspace creation payload (includes name, members, etc.).
	 * @returns A simplified workspace object (id, name, slug).
	 * @throws BadRequestException - If the API call fails.
	 */
	async create(data: ICreateWorkSpace) {
		try {
			const body = createOrganizationInputTransformer(data);

			const organization = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body
				})
			).data;

			return workspaceTransformer(organization);
		} catch (error: any) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			throw new BadRequestException(
				error?.response?.data?.message || 'Failed to create workspace'
			);
		}
	}
}
