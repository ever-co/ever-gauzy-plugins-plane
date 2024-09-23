import { ApiOperation } from '@nestjs/swagger';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
} from '@nestjs/common';
import { ID } from '@plane-plugin/models';
import { ProjectService } from './project.service';
import { CreateProjectDTO } from './dto';

@Controller()
export class ProjectController {
	constructor(private readonly _projectService: ProjectService) {}

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
	@Get()
	async getProjects() {
		return await this._projectService.getProjects();
	}

	/**
	 * @description - Get workspace project by ID
	 * @param {ID} id - The UUID primary key of the project to be fetched
	 * @returns - A promise that resolves after getting the project
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get one project' })
	@Get(':id')
	async getProject(@Param('id') id: ID) {
		return await this._projectService.getProject(id);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project members me' })
	@Get(':id/project-members/me')
	async getWorkspaceProjectMemberMe(@Param('id') id: ID) {
		return await this._projectService.getWorkspaceProjectMemberMe(id);
	}

	/**
	 * @description - Get project members
	 * @param {ID} id - The UUID primary key of the project for whom to get members
	 * @returns - A promise that resolves after getting the project members
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace project members' })
	@Get(':id/members')
	async getProjectMembers(@Param('id') id: ID) {
		return await this._projectService.getProjectMembers(id);
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
		return await this._projectService.createOrganizationProject(payload);
	}
}
