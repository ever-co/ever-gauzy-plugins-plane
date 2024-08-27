import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ID } from '@plane-plugin/models';
import { IssueLabelsService } from './issue-labels.service';
import { CreateIssueLabelDTO } from './dto';

@Controller('issue-labels')
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
	@Get(':projectId')
	async getAllByProjectId(@Param('projectId') projectId: ID) {
		return await this._issueLabelService.getProjectIssueLabels(projectId);
	}

	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue Label' })
	@Post(':projectId')
	async createIssueLabel(
		@Body() payload: CreateIssueLabelDTO,
		@Param('projectId') projectId: ID,
	) {
		return await this._issueLabelService.createIssueLabel(
			projectId,
			payload,
		);
	}
}
