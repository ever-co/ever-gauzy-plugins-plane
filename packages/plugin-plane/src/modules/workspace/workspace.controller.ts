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
     *--------------------------------------------------------------/
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
	 * @description - Get workspace projecy by ID
	 * @param {ID} id - The UUID primary key of the project to be fetched
	 * @returns - A promise that resolves after getting the project
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace projects' })
	@Get(':worspace_name/projects/:id')
	async getProject(@Param('id') id: ID) {
		return await this._workspaceService.getProject(id);
	}

	/**--------------------------------------------------------------
     * This function handlers should be updated after implementing authentication
     *--------------------------------------------------------------/
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
}
