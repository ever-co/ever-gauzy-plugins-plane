import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ICreateEmailInvitesOutput,
	ICreateWorkspaceInvitationInput,
	ID,
	IInvitation,
	IInvite,
	InviteStatusEnum,
	IPagination,
	IRole,
	RolesEnum
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { decodeToken } from '../api-fetch/token.helper';
import {
	createBulkWorkspaceInvitationInputTransformer,
	deleteInvitationQuery,
	getInvitationByTokenQuery,
	getInvitationsQuery,
	invitationTransformer,
	roleNameMap,
	sanitizeEmail
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

	/**
	 * Finds a single invitation by token and email.
	 *
	 * @param {Partial<IInvite>} options - Filter criteria (e.g. token, email).
	 * @returns {Promise<IInvitation | null>} The first matching invitation found, or null if none.
	 * @throws {BadRequestException} If the API requests fail.
	 */
	async findOne(options?: Partial<IInvite>): Promise<IInvitation | null> {
		try {
			const email = decodeToken(options?.token)?.email;
			const cleanEmail = sanitizeEmail(email);

			const query = qs.stringify(
				getInvitationByTokenQuery(options?.token, cleanEmail)
			);

			const invitationsRes: IInvite = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/validate`,
					query
				})
			).data;

			const transformed = invitationTransformer({
				...invitationsRes,
				id: options.token,
				status: InviteStatusEnum.INVITED,
				token: options.token
			});
			return Array.isArray(transformed) ? transformed[0] : transformed;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * Deletes an invitation by its ID.
	 *
	 * @async
	 * @param {ID} id - The ID of the invitation to delete.
	 * @returns {Promise<any>} The response data from the API after deletion.
	 * @throws {BadRequestException} Throws if the deletion request fails.
	 */
	async delete(id: ID): Promise<any> {
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
