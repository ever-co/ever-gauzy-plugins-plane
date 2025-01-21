import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import { IPagination, IUser, IUserOrganization } from '@plane-plugin/models';
import {
	currentEmployeeId,
	currentTenantId,
	getUserOrganizationsQueryParams,
	organizationsTranformer,
	roleTransformer,
	userMeTransformer
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

	async getMyProfile() {
		try {
		} catch (error) {}
		return {
			id: '4a6ee87a-7368-4625-8a52-5405e3078890',
			created_at: '2024-06-25T12:23:12.733949Z',
			updated_at: '2024-08-13T11:48:29.360720Z',
			theme: {},
			is_tour_completed: true,
			onboarding_step: {
				workspace_join: true,
				profile_complete: true,
				workspace_create: true,
				workspace_invite: true
			},
			use_case: 'Engineering',
			role: 'Individual contributor',
			is_onboarded: true,
			last_workspace_id: currentTenantId(),
			billing_address_country: 'INDIA',
			billing_address: null,
			has_billing_address: false,
			company_name: '',
			user: currentEmployeeId()
		};
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
