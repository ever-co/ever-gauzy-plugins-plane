import { BadRequestException, Injectable } from '@nestjs/common';
import {
	defaultEmployeeId,
	defaultTestTenantId,
	roleTransformer
} from '../../config';
import { ProjectService } from '../project/project.service';

@Injectable()
export class UserService {
	constructor(private readonly _projectService: ProjectService) {}

	async getMe() {
		return {
			id: defaultEmployeeId(),
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
			last_workspace_id: defaultTestTenantId(),
			billing_address_country: 'INDIA',
			billing_address: null,
			has_billing_address: false,
			company_name: '',
			user: defaultEmployeeId()
		};
	}

	async getMySettings() {
		return {
			id: defaultEmployeeId(),
			email: 'salva.cardano1@gmail.com',
			workspace: {
				last_workspace_id: defaultTestTenantId(),
				last_workspace_slug: 'cardano',
				fallback_workspace_id: defaultTestTenantId(),
				fallback_workspace_slug: 'cardano',
				invites: 0
			}
		};
	}

	async getMyWorkspaces() {
		return [
			{
				id: defaultTestTenantId(),
				owner: {
					id: defaultEmployeeId(),
					first_name: 'Salva',
					last_name: 'Cardano',
					avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJrkjUa3xiRgBrYPZSQ53906R4CPFcwCnQIE4SarJjw4IRZDQ=s96-c',
					is_bot: false,
					display_name: 'salva.cardano1'
				},
				total_members: 1,
				total_issues: 2,
				created_at: '2024-08-13T11:47:19.032854Z',
				updated_at: '2024-08-13T11:47:19.032867Z',
				deleted_at: null,
				name: 'Cardano',
				logo: null,
				slug: 'cardano',
				organization_size: '11-50',
				created_by: defaultEmployeeId(),
				updated_by: defaultEmployeeId()
			}
		];
	}

	async findProjectRoles(): Promise<{ [key: string]: number }> {
		try {
			const employeeId = defaultEmployeeId(); // TODO : Ensure that will be changed with authenticated employee
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
