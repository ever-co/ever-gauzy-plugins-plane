import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ID, IIssue } from '@plane-plugin/models';
import { WorkspaceService } from './workspace.service';
import { StatesService } from '../states/states.service';
import { IssuesService } from '../issues/issues.service';
import { IssueLabelsService } from '../issues/issue-labels/issue-labels.service';
import { ProjectService } from '../project/project.service';
import {
	CreateIssueLabelDTO,
	UpdateIssueLabelDTO,
} from '../issues/issue-labels/dto';
import { CreateIssueDTO, UpdateIssueDTO } from '../issues/dto';
import { CreateProjectDTO } from '../project/dto';

@ApiTags('Workspaces routes')
@Controller()
export class WorkspaceController {
	constructor(
		private readonly _issueLabelService: IssueLabelsService,
		private readonly _issueService: IssuesService,
		private readonly _projectService: ProjectService,
		private readonly _stateService: StatesService,
		private readonly _workspaceService: WorkspaceService,
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
		return await this._projectService.getProjects();
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
		return await this._projectService.getProject(id);
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
	@Get(':worspace_name/projects/:id/user-properties')
	async getProjectUserProperties(@Param('id') id: ID) {
		return await this._workspaceService.getProjectUserProperties(id);
	}

	/**
	 * @description - Create project state
	 * @param {ICreateStateInput} payload
	 * @returns - A promise that resolves after state created
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create project state' })
	@Post(':worspace_name/projects/:id/states')
	async createProjectState(
		@Param('id') project_id: ID,
		@Body() payload: CreateProjectDTO,
	) {
		return await this._stateService.create({
			...payload,
			project_id,
		});
	}

	/**
	 * @description - Create project state
	 * @param {ID} id - the of the state to be deleted
	 * @returns - A promise that resolves after state deleted
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete project state' })
	@Delete(':worspace_name/projects/:projectId/states/:id')
	async deleteProjectState(@Param('id') id: ID) {
		return await this._stateService.delete(id);
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

	/**
	 * @description - Create issue label
	 * @param {ID} projectId - the project ID for whom to associate with created label
	 * @param {CreateIssueLabelDTO} payload - data for creating label
	 * @returns - A promise that resolves after created label
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue Label' })
	@Post(':worspace_name/projects/:id/issue-labels')
	async createIssueLabel(
		@Body() payload: CreateIssueLabelDTO,
		@Param('id') projectId: ID,
	) {
		return await this._issueLabelService.createIssueLabel(
			projectId,
			payload,
		);
	}

	/**
	 * @description - Create issue
	 * @param {CreateIssueDTO} payload - data for creating new issue
	 * @returns - A promise that resolves after issue created
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue' })
	@Post(':worspace_name/projects/:projectId/issues')
	async createIssue(@Body() payload: CreateIssueDTO): Promise<IIssue> {
		return await this._issueService.create(payload);
	}

	/**
	 * @description - Update issue
	 * @param {UpdateIssueDTO} payload - data for updating issue
	 * @returns - A promise that resolves after issue updated
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Update Issue' })
	@Patch(':worspace_name/projects/:projectId/issues/:id')
	async updateIssue(
		@Body() payload: UpdateIssueDTO,
		@Param('id') id: ID,
	): Promise<IIssue> {
		return await this._issueService.update(id, payload);
	}

	/**
	 * @description - Update issue label
	 * @param {ID} id - the label ID to be updated
	 * @param {ID} projectId - the project ID for whom to associate with Updated label
	 * @param {UpdateIssueLabelDTO} payload - data for updating label
	 * @returns - A promise that resolves after Updated label
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update Issue Label' })
	@Patch(':worspace_name/projects/:projectId/issue-labels/:id')
	async updateIssueLabel(
		@Body() payload: UpdateIssueLabelDTO,
		@Param('id') id: ID,
		@Param('projectId') projectId: ID,
	) {
		return await this._issueLabelService.updateIssueLabel(
			id,
			projectId,
			payload,
		);
	}

	/**
	 * @description - Delete label
	 * @param {ID} id - The label ID to be deleted
	 * @returns - A promise that resolves after label deleted
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete Issue Label' })
	@Delete(':worspace_name/projects/:projectId/issue-labels/:id')
	async deleteIssueLabel(@Param('id') id: ID) {
		return await this._issueLabelService.deleteIssueLabel(id);
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
		return await this._stateService.getWorkspaceProjectStates(id);
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
		return await this._projectService.getWorkspaceProjectMemberMe(id);
	}

	/**
	 * @description - Get project issues
	 * @param {ID} projectId - The ID of the project for whom get issues
	 * @returns - A promise that resolves after got issues
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project issues' })
	@Get(':worspace_name/projects/:projectId/issues')
	async getWorkspaceProjectIssues(@Param('projectId') projectId: ID) {
		return this._issueService.getAllIssuesByProject(projectId);
	}

	/**
	 * @description - Find issue by Id
	 * @param {ID} id - The issue ID to search
	 * @returns - A promise that resolves after issue fetched
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find issue by ID' })
	@Get(':worspace_name/projects/:projectId/issues/:id')
	async findOneIssue(@Param('id') id: ID) {
		return await this._issueService.findOne(id);
	}

	/**
	 * @description - Find issue children by Id
	 * @param {ID} id - The issue ID to search
	 * @returns - A promise that resolves after issue children fetched
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find issue by ID' })
	@Get(':worspace_name/projects/:projectId/issues/:id/sub-issues')
	async findIssueSubIssues(@Param('id') id: ID) {
		return await this._issueService.findIssueChildren(id);
	}

	/**
	 * @description - Get project issue labels
	 * @param {ID} id - The ID of the project for whom get issue labels
	 * @returns - A promise that resolves after got issue labels
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project issues' })
	@Get(':worspace_name/projects/:id/issue-labels')
	async getProjectIssueLabels(@Param('id') id: ID) {
		return this._issueLabelService.getProjectIssueLabels(id);
	}
}
