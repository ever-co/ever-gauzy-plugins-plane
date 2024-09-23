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
import { ID, IModule } from '@plane-plugin/models';
import { WorkspaceService } from './workspace.service';
import { StatesService } from '../states/states.service';
import { IssueLabelsService } from '../issues/issue-labels/issue-labels.service';
import { ProjectModuleService } from '../project-module/project-module.service';
import {
	CreateIssueLabelDTO,
	UpdateIssueLabelDTO,
} from '../issues/issue-labels/dto';
import { CreateProjectDTO } from '../project/dto';
import { CreateModuleDTO } from '../project-module/dto';

@ApiTags('Workspaces routes')
@Controller()
export class WorkspaceController {
	constructor(
		private readonly _issueLabelService: IssueLabelsService,
		private readonly _stateService: StatesService,
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
