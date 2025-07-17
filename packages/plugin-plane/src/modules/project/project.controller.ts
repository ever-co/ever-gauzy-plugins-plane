import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import {
	Body,
	Controller,
	Delete,
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
import { UpdateProjectDTO } from './dto/update-project.dto';

@ApiTags('Projects')
@Controller()
export class ProjectController {
	constructor(private readonly _projectService: ProjectService) {}

	/**
	 * @description - Get all projects for a workspace - We will filter this with employee projects
	 * @returns - A promise that resolves after getting all projects for a workspace
	 * @memberof ProjectController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get workspace projects' })
	@Get('details')
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
			'members.employee.user.role',
			'members.role',
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
	 * Archives a workspace project by setting its `archived_at` timestamp.
	 *
	 * @param {ID} id - The ID of the project to be archived.
	 * @returns {Promise<any>} - The updated project after archiving.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Archive workspace projects' })
	@ApiResponse({
		status: 201,
		description: 'The project was successfully archived.'
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request. The project ID might be invalid.'
	})
	@Post(':id/archive')
	async archive(@Param('id') id: ID): Promise<any> {
		return await this._projectService.update(id, {
			archived_at: new Date()
		});
	}

	/**
	 * @description - Add other members to project
	 * @param {ID} id - The project ID
	 * @param {IProjectMember[]} input - New Members to be added
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
	async update(@Param('id') id: ID, @Body() input: UpdateProjectDTO) {
		return await this._projectService.update(id, input);
	}

	/**
	 * @description Update the user properties in the project
	 * @param {ID} id The project ID
	 * @param input Data to be updated
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

	/**
	 * Deletes a workspace project by its ID.
	 *
	 * @param {ID} id - The ID of the project to be deleted.
	 * @returns - The result of the deletion operation.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Delete workspace project' })
	@ApiResponse({
		status: 200,
		description: 'The project was successfully deleted.'
	})
	@ApiResponse({
		status: 400,
		description:
			'Bad Request. The project ID might be invalid or cause a conflict.'
	})
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return await this._projectService.delete(id);
	}

	/**
	 * Un-archives a workspace project by clearing its `archived_at` timestamp.
	 *
	 * @param {ID} id - The ID of the project to be un-archived.
	 * @returns {Promise<any>} - The updated project after un-archiving.
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Un-archive workspace projects' })
	@ApiResponse({
		status: 201,
		description: 'The project was successfully un-archived.'
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request. The project ID might be invalid.'
	})
	@Delete(':id/archive')
	async unarchive(@Param('id') id: ID): Promise<any> {
		return await this._projectService.update(id, {
			archived_at: null
		});
	}
}
