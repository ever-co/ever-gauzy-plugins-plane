import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { IssuesService } from './issues.service';
import { ID, IIssue } from '@plane-plugin/models';
import { CreateIssueDTO } from './dto';

@ApiTags('Issues routes')
@Controller()
export class IssuesController {
	constructor(private readonly _issueService: IssuesService) {}

	/**
	 * @description - Create issue
	 * @param {CreateIssueDTO} payload - data for creating new issue
	 * @returns - A promise that resolves after issue created
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue' })
	@Post()
	async create(@Body() payload: CreateIssueDTO): Promise<IIssue> {
		return await this._issueService.create(payload);
	}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Issues' })
	@Get(':projectId')
	async getAllByProjectId(@Param('projectId') projectId: ID) {
		return await this._issueService.getAllIssuesByProject(projectId);
	}
}
