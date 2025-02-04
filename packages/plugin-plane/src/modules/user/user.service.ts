import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IPagination,
	IUser,
	IUserOrganization,
	IUserProfile
} from '@plane-plugin/models';
import {
	currentEmployeeId,
	currentUserId,
	getUserMeQueryParams,
	getUserOrganizationsQueryParams,
	organizationsTranformer,
	roleTransformer,
	updateUserProfileInputTranformer,
	userMeTransformer,
	userProfileTransformer,
	userSettingsTranformer
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { ProjectService } from '../project/project.service';

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
			console.log(error);
			throw new BadRequestException(error);
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
			console.log(error);
			throw new BadRequestException(error);
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
			console.log(error);
			throw new BadRequestException(error);
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
			console.log(error);
			throw new BadRequestException(error);
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
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Retrieves and transforms the current user's workspaces with organization details
	 * @returns Array of transformed organizations with owner and member information
	 */
	async getMyWorkspaces() {
		try {
			const query = qs.stringify(
				getUserOrganizationsQueryParams([
					'organization.employees.user.role'
				])
			);

			const userOrganizations: IPagination<IUserOrganization> = (
				await this.apiFetch({
					method: 'GET',
					path: '/user-organization',
					query
				})
			).data;

			const organizations = userOrganizations.items.map(
				(userOrg) => userOrg.organization
			);

			return organizationsTranformer(organizations);
		} catch (error: any) {
			console.log(error);
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
					employeeId,
					['members.employee.user.role']
				);

			const projectRoles = employeeProjects.reduce(
				(acc, project) => {
					const member = project.members.find(
						(member) => member.employeeId === employeeId
					);

					if (member) {
						acc[project.id] = roleTransformer(
							member.employee.user.role
						);
					}
					return acc;
				},
				{} as { [key: string]: number }
			);

			return projectRoles;
		} catch (error: any) {
			console.log(error.response);
			throw new BadRequestException(error.response);
		}
	}
}
