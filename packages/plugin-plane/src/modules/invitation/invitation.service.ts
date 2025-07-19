import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ICreateEmailInvitesOutput,
	ICreateWorkspaceInvitationInput,
	ID,
	IInvitation,
	IInvite,
	IPagination,
	IRole,
	RolesEnum
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	createBulkWorkspaceInvitationInputTransformer,
	deleteInvitationQuery,
	getInvitationsQuery,
	invitationTransformer,
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

	/**
	 * Fetches all invitation records from the API, with optional filters applied via query parameters.
	 *
	 * The method builds a query string from `getInvitationsQuery({})`, sends a GET request,
	 * transforms the results using `invitationTransformer`, and returns the list of invitations.
	 *
	 * @returns {Promise<IInvitation[]>} A promise that resolves to a list of transformed invitation objects.
	 *
	 * @throws {BadRequestException} If the API request fails, the error response is logged and rethrown as a BadRequestException.
	 */
	async findAll(): Promise<IInvitation[]> {
		try {
			const query = qs.stringify(getInvitationsQuery({}));
			const employeeInvitesQuery = qs.stringify(
				getInvitationsQuery({ role: { name: RolesEnum.EMPLOYEE } })
			);

			const [invitationsRes, employeeInvitationsRes]: [
				{ data: IPagination<IInvite> },
				{ data: IPagination<IInvite> }
			] = await Promise.all([
				this.apiFetch({ method: 'GET', path: this.path, query }),
				this.apiFetch({
					method: 'GET',
					path: this.path,
					query: employeeInvitesQuery
				})
			]);

			const allItems = [
				...invitationsRes.data.items,
				...employeeInvitationsRes.data.items
			];

			const transformed = invitationTransformer(allItems);

			return Array.isArray(transformed) ? transformed : [transformed];
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error.response);
		}
	}

	async delete(id: ID) {
		try {
			const query = qs.stringify(deleteInvitationQuery());

			return (
				await this.apiFetch({
					method: 'DELETE',
					path: `${this.path}/${id}`,
					query
				})
			).data;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
