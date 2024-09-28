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
import { ID, IIssue, IssueActivityTypeEnum } from '@plane-plugin/models';
import { IssuesService } from './issues.service';
import { CreateIssueCommentDTO, CreateIssueDTO, UpdateIssueDTO } from './dto';

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

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Find issue activity' })
	@Get(':id/history')
	async findActivity(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID,
		@Query('activity_type') activity_type: IssueActivityTypeEnum,
	) {
		return await this._issueService.findActivity(
			id,
			projectId,
			activity_type,
		);
	}

	/**
	 * @description - Create issue
	 * @param {CreateIssueDTO} input - data for creating new issue
	 * @returns - A promise that resolves after issue created
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue' })
	@Post()
	async create(@Body() input: CreateIssueDTO): Promise<IIssue> {
		return await this._issueService.create(input);
	}

	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue Comment' })
	@Post(':id/comments')
	async createComment(
		@Param('id') entityId: ID,
		@Param('projectId') projectId: ID,
		@Body() input: CreateIssueCommentDTO,
	): Promise<IIssue> {
		return await this._issueService.createComment(
			entityId,
			projectId,
			input,
		);
	}

	/**
	 * @description - Update issue
	 * @param {UpdateIssueDTO} input - data for updating issue
	 * @returns - A promise that resolves after issue updated
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Update Issue' })
	@Patch(':id')
	async update(
		@Body() input: UpdateIssueDTO,
		@Param('id') id: ID,
	): Promise<IIssue> {
		return await this._issueService.update(id, input);
	}

	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete issue' })
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return await this._issueService.delete(id);
	}
}
