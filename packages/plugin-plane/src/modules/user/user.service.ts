import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	IPagination,
	IUser,
	IUserOrganization,
	IUserProfile
} from '@plane-plugin/models';
import {
	currentEmployeeId,
	currentTenantId,
	currentUserId,
	getUserOrganizationsQueryParams,
	organizationsTranformer,
	roleTransformer,
	updateUserProfileInputTranformer,
	userMeTransformer,
	userProfileTransformer
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
	async getMyProfile() {
		try {
			const query = qs.stringify({
				includeEmployee: true,
				'[relations][0]': 'tenant'
			});

			const user: IUser = (
				await this.apiFetch({
					path: '/user/me',
					method: 'GET',
					query
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
	async updateUserProfile(input: IUserProfile) {
		try {
			await this.apiFetch({
				path: `/user/${currentUserId()}`,
				method: 'PUT',
				body: updateUserProfileInputTranformer(input)
			});

			return await this.getMyProfile();
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	async getMySettings() {
		return {
			id: currentEmployeeId(),
			email: 'salva.cardano1@gmail.com',
			workspace: {
				last_workspace_id: currentTenantId(),
				last_workspace_slug: 'cardano',
				fallback_workspace_id: currentTenantId(),
				fallback_workspace_slug: 'cardano',
				invites: 0
			}
		};
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
