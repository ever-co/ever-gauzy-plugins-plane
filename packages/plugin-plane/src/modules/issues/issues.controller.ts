import {
	Body,
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ID, IIssue } from '@plane-plugin/models';
import { IssuesService } from './issues.service';
import { CreateIssueDTO, UpdateIssueDTO } from './dto';

@ApiTags('Issues routes')
@Controller()
export class IssuesController {
	constructor(private readonly _issueService: IssuesService) {}

	/**
	 * @description - Get project issues
	 * @param {ID} projectId - The ID of the project for whom get issues
	 * @returns - A promise that resolves after got issues
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Issues' })
	@Get()
	async getAllByProjectId(@Param('projectId') projectId: ID) {
		return await this._issueService.getAllIssuesByProject(projectId);
	}

	/**
	 * @description - Find issue by Id
	 * @param {ID} id - The issue ID to search
	 * @returns - A promise that resolves after issue fetched
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find issue by ID' })
	@Get(':id')
	async findOne(@Param('id') id: ID) {
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
	@Get(':id/sub-issues')
	async findIssueSubIssues(@Param('id') id: ID) {
		return await this._issueService.findIssueChildren(id);
	}

	/**
	 * @description - Find issue children by Id
	 * @param {ID} id - The issue ID to search
	 * @returns - A promise that resolves after issue children fetched
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find issue by ID' })
	@Get(':id/issue-relation')
	async findIssueRelations(@Param('id') id: ID) {
		return await this._issueService.findIssueRelations(id);
	}

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

	/**
	 * @description - Update issue
	 * @param {UpdateIssueDTO} payload - data for updating issue
	 * @returns - A promise that resolves after issue updated
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Update Issue' })
	@Patch(':id')
	async update(
		@Body() payload: UpdateIssueDTO,
		@Param('id') id: ID,
	): Promise<IIssue> {
		return await this._issueService.update(id, payload);
	}
}
