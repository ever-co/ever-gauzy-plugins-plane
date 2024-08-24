import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
	Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';
import { CreateProjectDTO } from './dto';
import { ID } from '@plane-plugin/models';

@ApiTags('Workspaces routes')
@Controller()
export class WorkspaceController {
	constructor(private readonly _workspaceService: WorkspaceService) {}

	/**
	 * @description - Get dashboard widgets for given workspace
	 * @param {string} workspace_name - slug for workspace name
	 * @param {string} dashboard_type - query that define which widget filter should be fetched
	 * @returns - A promise that resolves when dashboard widgets are fetched
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get dashboard widgets' })
	@Get(':worspace_name/dashboard')
	async getDashboard(
		@Param('worspace_name') workspace_name: string,
		@Query('dashboard_type') dashboard_type: string,
	) {
		return await this._workspaceService.getDashboard(
			workspace_name,
			dashboard_type,
		);
	}

	/**
	 * @description - Get member (from connected user) info for a workspace
	 * @param {string} workspace_name - slug for workspace name
	 * @returns - A promise that resolves after getting member informations
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get member info for given workspace' })
	@Get(':worspace_name/workspace-members/me')
	async getMembersMe(@Param('worspace_name') workspace_name: string) {
		return await this._workspaceService.getMembersMe(workspace_name);
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get all projects for a workspace
	 * @returns - A promise that resolves after getting all projects for a workspace
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace projects' })
	@Get(':worspace_name/projects')
	async getProjects() {
		return await this._workspaceService.getProjects();
	}

	/**
	 * @description - Get workspace project by ID
	 * @param {ID} id - The UUID primary key of the project to be fetched
	 * @returns - A promise that resolves after getting the project
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get one project' })
	@Get(':worspace_name/projects/:id')
	async getProject(@Param('id') id: ID) {
		return await this._workspaceService.getProject(id);
	}

	/**
	 * @description - Get project members
	 * @param {ID} id - The UUID primary key of the project for whom to get members
	 * @returns - A promise that resolves after getting the project members
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace project members' })
	@Get(':worspace_name/projects/:id/members')
	async getProjectMembers(@Param('id') id: ID) {
		return await this._workspaceService.getProjectMembers(id);
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication and User features
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get user properties project
	 * @param {ID} id - The UUID primary key of the project for whom get properties
	 * @returns - A promise that resolves after getting the promises
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get user properties project' })
	@Get(':worspace_name/projects/:id/user-properties')
	async getProjectUserProperties(@Param('id') id: ID) {
		return await this._workspaceService.getProjectUserProperties(id);
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication (Reason : retrive the workspace ID from request session)
	 *--------------------------------------------------------------*/
	/**
	 * @description - Create new Project in workspace
	 * @param {CreateProjectDTO} payload - input data with which to create project
	 * @returns - A promise that resolves after created project
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create workspace projects' })
	@Post(':worspace_name/projects')
	async createOrganizationProject(@Body() payload: CreateProjectDTO) {
		return await this._workspaceService.createOrganizationProject(payload);
	}

	/**
	 * @description - Get all projects for a workspace
	 * @returns - A promise that resolves after getting all projects for a workspace
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project states' })
	@Get(':worspace_name/projects/:id/states')
	async getWorkspaceProjectStates(@Param('id') id: ID) {
		return await this._workspaceService.getWorkspaceProjectStates(id);
	}

	// @HttpCode(HttpStatus.OK)
	// @ApiOperation({ summary: 'Get project cycles' })
	// @Get(':worspace_name/projects/:id/cycles')
	// async getWorkspaceProjectCycles(@Param('id') id: ID) {
	// 	return [];
	// }

	// @HttpCode(HttpStatus.OK)
	// @ApiOperation({ summary: 'Get project estimates' })
	// @Get(':worspace_name/projects/:id/estimates')
	// async getWorkspaceProjectEstimates(@Param('id') id: ID) {
	// 	return [];
	// }

	// @HttpCode(HttpStatus.OK)
	// @ApiOperation({ summary: 'Get project modules' })
	// @Get(':worspace_name/projects/:id/modules')
	// async getWorkspaceProjectModules(@Param('id') id: ID) {
	// 	return [];
	// }

	// @HttpCode(HttpStatus.OK)
	// @ApiOperation({ summary: 'Get project cycles' })
	// @Get(':worspace_name/projects/:id/views')
	// async getWorkspaceProjectViews(@Param('id') id: ID) {
	// 	return [];
	// }

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project members me' })
	@Get(':worspace_name/projects/:id/project-members/me')
	async getWorkspaceProjectMemberMe(@Param('id') id: ID) {
		return {
			id: 'f6d11360-882d-44c1-a55c-dd3d5d8fe5d4',
			workspace: {
				name: 'Cardano',
				slug: 'cardano',
				id: '053afc1b-c258-46b9-bda0-7c210014284c',
			},
			project: {
				id: '7c87301a-33e5-4a8f-871c-f0885b2a560b',
				identifier: 'PLUGI',
				name: 'Plugin App',
				cover_image:
					'https://images.unsplash.com/photo-1542202229-7d93c33f5d07?auto=format&fit=crop&q=80&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&w=870&q=80',
				logo_props: {
					emoji: {
						value: '127891',
					},
					in_use: 'emoji',
				},
				description: '',
			},
			member: {
				id: '61498b95-ca39-4464-93b3-acb8b14dee3e',
				first_name: 'Salva',
				last_name: 'Cardano',
				avatar: 'https://lh3.googleusercontent.com/a/ACg8ocJrkjUa3xiRgBrYPZSQ53906R4CPFcwCnQIE4SarJjw4IRZDQ=s96-c',
				is_bot: false,
				display_name: 'salva.cardano1',
			},
			created_at: '2024-08-20T14:27:11.209351Z',
			updated_at: '2024-08-20T14:27:11.209363Z',
			deleted_at: null,
			comment: null,
			role: 20,
			view_props: {
				filters: {
					state: null,
					labels: null,
					priority: null,
					assignees: null,
					created_by: null,
					start_date: null,
					subscriber: null,
					state_group: null,
					target_date: null,
				},
				display_filters: {
					type: null,
					layout: 'list',
					group_by: null,
					order_by: '-created_at',
					sub_issue: true,
					show_empty_groups: true,
					calendar_date_range: '',
				},
			},
			default_props: {
				filters: {
					state: null,
					labels: null,
					priority: null,
					assignees: null,
					created_by: null,
					start_date: null,
					subscriber: null,
					state_group: null,
					target_date: null,
				},
				display_filters: {
					type: null,
					layout: 'list',
					group_by: null,
					order_by: '-created_at',
					sub_issue: true,
					show_empty_groups: true,
					calendar_date_range: '',
				},
			},
			preferences: {
				pages: {
					block_display: true,
				},
			},
			sort_order: 65535.0,
			is_active: true,
			created_by: '61498b95-ca39-4464-93b3-acb8b14dee3e',
			updated_by: '61498b95-ca39-4464-93b3-acb8b14dee3e',
		};
	}
}
