import { BadRequestException, Injectable } from '@nestjs/common';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	ICreateEmailInvitesOutput,
	ICreateWorkspaceInvitationInput,
	IRole
} from '@plane-plugin/models';
import {
	createBulkWorkspaceInvitationInputTransformer,
	roleNameMap
} from '../../config';

@Injectable()
export class InvitationService extends ApiFetchService {
	constructor(private readonly _serverFetchService: ApiFetchService) {
		super(_serverFetchService['_httpService']);
	}

	// The main endpoint for workspaces is the organization
	private readonly path = '/invite';

	/**
	 * Sends bulk workspace invitations via email.
	 *
	 * For each email in the input list, it:
	 * 1. Maps the numeric role to a `RolesEnum` using `roleNameMap`.
	 * 2. Fetches the corresponding role object from the roles API.
	 * 3. Transforms the invitation input using `createBulkWorkspaceInvitationInputTransformer`.
	 * 4. Sends a POST request to invite the user by email.
	 *
	 * @param {{emails: ICreateWorkspaceInvitationInput[]}} input - Input object containing an array of email invitation payloads.
	 * @param {ICreateWorkspaceInvitationInput[]} input.emails - List of users to invite, each with a role number and email.
	 * @returns {Promise<ICreateEmailInvitesOutput[]>} A promise that resolves with the array of created invitation responses.
	 *
	 * @throws {BadRequestException} If any error occurs during the invitation creation process.
	 */
	async createBulkWorksapceInvitation(input: {
		emails: ICreateWorkspaceInvitationInput[];
	}): Promise<ICreateEmailInvitesOutput[]> {
		try {
			const { emails } = input;

			const invitations = await Promise.all(
				emails.map(async (email) => {
					const roleName = roleNameMap(email.role);

					const role: IRole = (
						await this.apiFetch({
							method: 'GET',
							path: `/roles/options?name=${roleName}`
						})
					).data;

					const body = createBulkWorkspaceInvitationInputTransformer(
						email,
						role.id
					);

					const invitation: ICreateEmailInvitesOutput = (
						await this.apiFetch({
							method: 'POST',
							path: `${this.path}/emails`,
							body
						})
					).data;

					return invitation;
				})
			);

			return invitations;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error.response);
		}
	}
}
