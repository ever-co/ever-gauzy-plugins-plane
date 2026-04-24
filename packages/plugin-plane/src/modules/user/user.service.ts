import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IPagination,
	IUser,
	IUserOrganization,
	IUserProfile
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	currentEmployeeId,
	currentUserId,
	getUserMeQueryParams,
	getUserOrganizationsQueryParams,
	organizationsTranformer,
	updateUserProfileInputTranformer,
	userMeTransformer,
	userProfileTransformer,
	userSettingsTranformer,
	workspacesResponseTransformer
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { decodeToken } from '../api-fetch/token.helper';
import { ProjectService } from '../project/project.service';
import { WorkspaceContextService } from '../workspace/workspace-context.service';

@Injectable()
export class UserService extends ApiFetchService {
	constructor(
		private readonly _projectService: ProjectService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

	/**
	 * Retrieves basic information about the currently authenticated user
	 * @returns Transformed user data with basic profile details
	 * @throws {BadRequestException} If the API request fails
	 */
	async getMe() {
		try {
			const query = qs.stringify({ includeEmployee: true });

			const user: IUser = (
				await this.apiFetch({
					path: '/user/me',
					method: 'GET',
					query
				})
			).data;

			return userMeTransformer(user);
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Retrieves detailed profile information about the currently authenticated user
	 * @returns Extended user profile including theme, onboarding, and organization details
	 * @throws {BadRequestException} If the API request fails
	 */
	async getMyProfile(token?: string, tenantId?: ID) {
		try {
			const query = qs.stringify(getUserMeQueryParams);

			const user: IUser = (
				await this.apiFetch({
					path: '/user/me',
					method: 'GET',
					query,
					bearer_token: token,
					tenantId
				})
			).data;

			return userProfileTransformer(user);
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Updates the current user's profile information
	 * @param input - Profile data to update
	 * @returns Updated user profile after successful modification
	 * @throws {BadRequestException} If the API request fails
	 */
	async updateUserProfile(
		input: IUserProfile,
		token?: string,
		tenantId?: ID
	) {
		try {
			await this.apiFetch({
				path: `/user/${currentUserId(token)}`,
				method: 'PUT',
				body: updateUserProfileInputTranformer(input),
				bearer_token: token,
				tenantId
			});

			return await this.getMyProfile(token, tenantId);
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}
	/**
	 * Updates the user's profile information on the server.
	 *
	 * @async
	 * @param {IUserProfile} input - The updated user profile information.
	 * @returns A promise that resolves to the updated user profile information.
	 */
	async updateUserInfo(input: IUserProfile) {
		try {
			await this.apiFetch({
				path: `/user/${currentUserId()}`,
				method: 'PUT',
				body: updateUserProfileInputTranformer(input)
			});

			return this.getMe();
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Fetches the current user's settings from the server.
	 *
	 * @async
	 * @returns A promise that resolves to the user's settings.
	 */
	async getMySettings() {
		try {
			const query = qs.stringify(getUserMeQueryParams);
			const user: IUser = (
				await this.apiFetch({
					path: '/user/me',
					method: 'GET',
					query
				})
			).data;

			return userSettingsTranformer(user);
		} catch (error) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * Retrieves and transforms the current user's workspaces across all tenants.
	 *
	 * Uses Gauzy's GET /auth/workspaces to discover all tenants, then for each
	 * tenant calls /auth/signin.workspace to get a valid token, and finally
	 * queries /user-organization with that token to get the actual organizations.
	 *
	 * Falls back to the single-tenant /user-organization endpoint if the
	 * cross-tenant call fails.
	 *
	 * @returns Array of transformed organizations with owner and member information
	 */
	async getMyWorkspaces() {
		try {
			// Step 1: Discover all tenants via /auth/workspaces
			const response = (
				await this.apiFetch({
					method: 'GET',
					path: '/auth/workspaces'
				})
			).data;

			if (response?.workspaces?.length > 0) {
				this.logger.debug(
					`GET /auth/workspaces → ${response.total_workspaces} workspace(s) found`
				);

				const allOrganizations: IUserOrganization[] = [];

				// Step 2: For each workspace/tenant, get a token and query organizations
				for (const ws of response.workspaces) {
					try {
						const email = ws.user?.email;
						const wsToken = ws.token;
						const tenantId = ws.user?.tenant?.id || ws.user?.tenantId;

						if (!email || !wsToken) {
							this.logger.warn(`Skipping workspace: missing email or token`);
							continue;
						}

						// Get a valid access token for this tenant
						const authRes = (
							await this.apiFetch({
								method: 'POST',
								path: '/auth/signin.workspace',
								body: { email, token: wsToken }
							})
						).data;

						if (!authRes?.token) {
							this.logger.warn(
								`signin.workspace failed for tenant ${tenantId}: no token returned`
							);
							continue;
						}

						// Get the userId from the auth response token
						const decoded = decodeToken(authRes.token);
						const userId = decoded?.id;
						const resolvedTenantId = decoded?.tenantId || tenantId;

						if (!userId || !resolvedTenantId) {
							this.logger.warn(
								`Could not resolve userId/tenantId from workspace token`
							);
							continue;
						}

						// Query user-organization for this tenant
						const orgQuery = qs.stringify({
							'where[tenantId]': resolvedTenantId,
							'where[userId]': userId,
							includeEmployee: true,
							'relations[0]': 'user.role',
							'relations[1]': 'organization'
						});

						const userOrgs: IPagination<IUserOrganization> = (
							await this.apiFetch({
								method: 'GET',
								path: '/user-organization',
								query: orgQuery,
								bearer_token: authRes.token,
								tenantId: resolvedTenantId
							})
						).data;

						if (userOrgs?.items?.length > 0) {
							// Store orgId → tenantId mapping for workspace switching
							for (const uo of userOrgs.items) {
								if (uo.organization?.id) {
									WorkspaceContextService.setOrgTenantMapping(
										uo.organization.id,
										resolvedTenantId
									);
								}
							}
							allOrganizations.push(...userOrgs.items);
						}

						this.logger.debug(
							`Tenant ${resolvedTenantId}: found ${userOrgs?.items?.length || 0} org(s)`
						);
					} catch (wsError: any) {
						this.logger.warn(
							`Failed to load orgs for workspace: ${wsError?.response?.status || ''} ${wsError?.message}`
						);
					}
				}

				if (allOrganizations.length > 0) {
					return organizationsTranformer(allOrganizations);
				}
			}
		} catch (error: any) {
			this.logger.warn(
				`Cross-tenant workspace listing failed, falling back to single-tenant: ${error?.response?.status || ''} ${error?.message}`
			);
		}

		// Fallback: single-tenant behavior
		try {
			const query = qs.stringify(
				getUserOrganizationsQueryParams(['user.role', 'organization'])
			);

			const userOrganizations: IPagination<IUserOrganization> = (
				await this.apiFetch({
					method: 'GET',
					path: '/user-organization',
					query
				})
			).data;

			return organizationsTranformer(userOrganizations.items);
		} catch (error: any) {
			this.logger.error(
				'Operation failed',
				error instanceof Error ? error.stack : String(error)
			);
			return [];
		}
	}

	/**
	 * Retrieves the roles associated with a project
	 * @returns An object where each key is a project ID and the value is the role ID
	 */
	async findProjectRoles(): Promise<{ [key: string]: number }> {
		try {
			const employeeId = currentEmployeeId();
			const employeeProjects =
				await this._projectService.getExternalProjectsByEmployee(
					employeeId!,
					['members.employee.user.role', 'members.role']
				);

			const projectRoles = employeeProjects.reduce(
				(acc, project) => {
					const member = project.members!.find(
						(member) => member.employeeId === employeeId
					);

					if (member) {
						acc[project.id!] = member.isManager ? 20 : 15;
					}
					return acc;
				},
				{} as { [key: string]: number }
			);

			return projectRoles;
		} catch (error: any) {
			this.logger.error(
				`Operation failed: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			this.handleApiError(error);
		}
	}
}
