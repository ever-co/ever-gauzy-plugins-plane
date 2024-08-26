import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { ID } from '@plane-plugin/models';

@ApiTags('Issues routes')
@Controller()
export class IssuesController {
	constructor(private readonly _issueService: IssuesService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Issues' })
	@Get(':projectId')
	async getAllByProjectId(@Param('projectId') projectId: ID) {
		return await this._issueService.getAllIssuesByProject(projectId);
	}
}
