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
import { ApiOperation } from '@nestjs/swagger';
import { ID } from '@plane-plugin/models';
import { IssueLabelsService } from './issue-labels.service';
import { CreateIssueLabelDTO, UpdateIssueLabelDTO } from './dto';

@Controller()
export class IssueLabelsController {
	constructor(private readonly _issueLabelService: IssueLabelsService) {}

	/**
	 * @description - Get project issue labels
	 * @param {ID} projectId - the project ID for whom getting labels
	 * @returns  - A promise that resolves after get labels
	 * @memberof IssueLabelsController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Issue Labels By project' })
	@Get()
	async getAllByProjectId(@Param('projectId') projectId: ID) {
		return await this._issueLabelService.getProjectIssueLabels(projectId);
	}

	/**
	 * @description - Create issue label
	 * @param {ID} projectId - the project ID for whom to associate with created label
	 * @param {CreateIssueLabelDTO} input - data for creating label
	 * @returns - A promise that resolves after created label
	 * @memberof IssueLabelsController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue Label' })
	@Post()
	async createIssueLabel(
		@Body() input: CreateIssueLabelDTO,
		@Param('projectId') projectId: ID
	) {
		return await this._issueLabelService.createIssueLabel(projectId, input);
	}

	/**
	 * @description - Update issue label
	 * @param {ID} id - the label ID to be updated
	 * @param {ID} projectId - the project ID for whom to associate with Updated label
	 * @param {UpdateIssueLabelDTO} input - data for updating label
	 * @returns - A promise that resolves after Updated label
	 * @memberof IssueLabelsController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update Issue Label' })
	@Patch(':id')
	async updateIssueLabel(
		@Body() input: UpdateIssueLabelDTO,
		@Param('id') id: ID,
		@Param('projectId') projectId: ID
	) {
		return await this._issueLabelService.updateIssueLabel(
			id,
			projectId,
			input
		);
	}

	/**
	 * @description - Delete label
	 * @param {ID} id - The label ID to be deleted
	 * @returns - A promise that resolves after label deleted
	 * @memberof IssueLabelsController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete Issue Label' })
	@Delete(':id')
	async deleteIssueLabel(@Param('id') id: ID) {
		return await this._issueLabelService.deleteIssueLabel(id);
	}
}
