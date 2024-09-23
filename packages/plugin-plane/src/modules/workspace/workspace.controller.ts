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
import { ID, IModule } from '@plane-plugin/models';
import { WorkspaceService } from './workspace.service';
import { ProjectModuleService } from '../project-module/project-module.service';
import { CreateModuleDTO } from '../project-module/dto';

@ApiTags('Workspaces routes')
@Controller()
export class WorkspaceController {
	constructor(
		private readonly _workspaceService: WorkspaceService,
		private readonly _moduleService: ProjectModuleService,
	) {}

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

	/**
	 * @description - Get members for a workspace
	 * @returns - A promise that resolves after getting members for a workspace
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace members' })
	@Get(':worspace_name/members')
	async getMembers() {
		return await this._workspaceService.getWorkspaceMembers();
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

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project cycles' })
	@Get(':worspace_name/projects/:id/cycles')
	async getWorkspaceProjectCycles(@Param('id') id: ID) {
		return [];
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project estimates' })
	@Get(':worspace_name/projects/:id/estimates')
	async getWorkspaceProjectEstimates(@Param('id') id: ID) {
		return [];
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project cycles' })
	@Get(':worspace_name/projects/:id/views')
	async getWorkspaceProjectViews(@Param('id') id: ID) {
		return [];
	}

	/**
	 * @description - Create module
	 * @param {ICreateModuleInput} payload - data for creating new module
	 * @returns - A promise that resolves after module created
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create module' })
	@Post(':worspace_name/projects/:projectId/modules')
	async createModule(
		@Body() payload: CreateModuleDTO,
	): Promise<IModule | IModule[]> {
		return await this._moduleService.create(payload);
	}

	/**
	 * @description - Get project modules
	 * @param {ID} projectId - The ID of the project for whom get modules
	 * @returns - A promise that resolves after got modules
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project modules' })
	@Get(':worspace_name/projects/:projectId/modules')
	async getWorkspaceProjectModules(@Param('projectId') projectId: ID) {
		return this._moduleService.getAllModulesByProject(projectId);
	}
}
