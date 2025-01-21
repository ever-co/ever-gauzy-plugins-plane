import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	IPagination,
	IUserOrganization,
	RolesEnum
} from '@plane-plugin/models';
import {
	currentEmployeeId,
	currentTenantId,
	getUserOrganizationsQueryParams,
	roleTransformer
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
		return {
			id: currentEmployeeId(),
			avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJrkjUa3xiRgBrYPZSQ53906R4CPFcwCnQIE4SarJjw4IRZDQ=s96-c',
			cover_image: null,
			date_joined: '2024-06-25T12:23:12.642525Z',
			display_name: 'salva.cardano1',
			email: 'salva.cardano1@gmail.com',
			first_name: 'Salva',
			last_name: 'Cardano',
			is_active: true,
			is_bot: false,
			is_email_verified: true,
			user_timezone: 'UTC',
			username: '1612687cee92431b8c6da7d1532cb7a4',
			is_password_autoset: false,
			last_login_medium: 'email'
		};
	}

	async getMyProfile() {
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

			console.log({ organizations });

			return organizations.map((organization) => {
				const owner = organization.employees.find((employee) => {
					const employeeRole = employee.user.role.name;
					return (
						employeeRole === RolesEnum.SUPER_ADMIN ||
						employeeRole === RolesEnum.ADMIN ||
						employeeRole === RolesEnum.MANAGER
					);
				});

				return {
					id: organization.id,
					owner: {
						id: owner?.id,
						first_name: owner?.user.firstName,
						last_name: owner?.user.lastName,
						avatar: owner?.user.imageUrl,
						is_bot: false,
						display_name: owner?.user.fullName
					},
					total_members: organization.employees.length,
					// total_issues: organization.ta.length,
					created_at: organization.createdAt,
					updated_at: organization.updatedAt,
					deleted_at: organization.deletedAt,
					name: organization.name,
					logo: organization.imageUrl,
					slug: organization.id,
					organization_size:
						organization.minimumProjectSize || '11-50'
					// created_by: organization.createdBy,
					// updated_by: organization.updatedBy
				};
			});
		} catch (error: any) {
			console.log(error);
			return [];
		}
	}

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
