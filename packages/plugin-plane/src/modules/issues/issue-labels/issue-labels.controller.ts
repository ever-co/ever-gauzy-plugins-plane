import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { IssueLabelsService } from './issue-labels.service';
import { ID } from '@plane-plugin/models';

@Controller('issue-labels')
export class IssueLabelsController {
	constructor(private readonly _issueLabelService: IssueLabelsService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Issue Labels By project' })
	@Get(':projectId')
	async getAllByProjectId(@Param('projectId') projectId: ID) {
		return await this._issueLabelService.getProjectIssueLabels(projectId);
	}
}
