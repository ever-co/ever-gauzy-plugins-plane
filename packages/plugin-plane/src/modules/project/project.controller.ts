import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post
} from '@nestjs/common';
import { ID } from '@plane-plugin/models';
import { ProjectService } from './project.service';
import { CreateProjectDTO, ProjectMemberDTO } from './dto';

@ApiTags('Projects')
@Controller()
export class ProjectController {
	constructor(private readonly _projectService: ProjectService) {}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication
	 *--------------------------------------------------------------*/
	/**
	 * @description - Get all projects for a workspace - We will filter this with employee projects
	 * @returns - A promise that resolves after getting all projects for a workspace
	 * @memberof ProjectController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace projects' })
	@Get()
	async getProjects() {
		return await this._projectService.getProjects([
			'members.employee.user.role',
			'organizationSprints',
			'modules'
		]);
	}

	/**
	 * @description - Get workspace project by ID
	 * @param {ID} id - The UUID primary key of the project to be fetched
	 * @returns - A promise that resolves after getting the project
	 * @memberof ProjectController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get one project' })
	@Get(':id')
	async getProject(@Param('id') id: ID) {
		return await this._projectService.getProject(id, [
			'members.employee.user',
			'organizationSprints',
			'tasks',
			'modules'
		]);
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
	 * @memberof ProjectController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace project members' })
	@Get(':id/members')
	async getProjectMembers(@Param('id') id: ID) {
		return await this._projectService.getProjectMembers(id);
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
	@Get(':id/user-properties')
	async getProjectUserProperties(@Param('id') id: ID) {
		return await this._projectService.getProjectUserProperties(id);
	}

	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication (Reason : retrive the workspace ID from request session)
	 *--------------------------------------------------------------*/
	/**
	 * @description - Create new Project in workspace
	 * @param {CreateProjectDTO} input - input data with which to create project
	 * @returns - A promise that resolves after created project
	 * @memberof ProjectController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create workspace projects' })
	@Post()
	async createOrganizationProject(@Body() input: CreateProjectDTO) {
		return await this._projectService.createOrganizationProject(input);
	}

	/**
	 * @description - Add other members to project
	 * @param {ID} id - The project ID
	 * @param {IProjectMember[]} members - New Members to be added
	 * @returns A promise resoved after members assigned to projec
	 * @memberof ProjectController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Assign members to project' })
	@Post(':id/members')
	async assignMembersToProject(
		@Body() input: { members: ProjectMemberDTO[] },
		@Param('id') id: ID
	) {
		return await this._projectService.assignMembersToProject(id, input);
	}

	/**
	 * @description Update project
	 * @param {ID} id The project ID
	 * @param {CreateProjectDTO} input Data to be updated
	 * @returns A promise that resolves after project updated
	 * @memberof ProjectController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update workspace projects' })
	@Patch(':id')
	async update(@Param('id') id: ID, @Body() input: CreateProjectDTO) {
		return await this._projectService.update(id, input);
	}

	/**
	 * @description Update project
	 * @param {ID} id The project ID
	 * @param {CreateProjectDTO} input Data to be updated
	 * @returns A promise that resolves after project updated
	 * @memberof ProjectController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update workspace projects' })
	@Patch(':id/user-properties')
	async updateProjectUserProperties(@Param('id') id: ID, @Body() input: any) {
		return await this._projectService.updateProjectUserProperties(
			id,
			input
		);
	}
}
