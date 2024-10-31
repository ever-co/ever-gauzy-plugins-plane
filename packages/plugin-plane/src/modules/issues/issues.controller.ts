import {
	Body,
	Controller,
	Delete,
	Get,
	Headers,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
	ID,
	IIssue,
	IIssueComment,
	IIssueFindInput,
	IIssueLink,
	IReactionData,
	IssueActivityTypeEnum,
	ISubIssueResponse,
} from '@plane-plugin/models';
import { IssuesService } from './issues.service';
import {
	CreateIssueCommentDTO,
	CreateIssueDTO,
	CreateIssueLinkDTO,
	CreateIssueReactionDTO,
	UpdateIssueDTO,
} from './dto';
import {
	CreateIssueRelationDTO,
	DeleteIssueRelationDTO,
} from '../issue-relations/dto';

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
	async getAllByProjectId(
		@Param('projectId') projectId: ID,
		@Query() options: IIssueFindInput,
		@Headers('referer') referer: string,
	) {
		return await this._issueService.getAllIssuesByProject(
			projectId,
			options,
			referer,
		);
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
	 * @description Get issue activity and comments
	 * @param {ID} id - Issue ID
	 * @param {ID} projectId - Project ID
	 * @param {IssueActivityTypeEnum} activity_type Activity type
	 * @returns A promise resolved after got comments or Activity Logs
	 * @memberof IssuesController
	 */
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

	/**
	 * Updates the parent-child relationship between a parent task and multiple sub-tasks.
	 *
	 * @param {ID} id - The ID of the parent task.
	 * @param {Pick<IIssueUpdateInput, 'sub_issue_ids'>} input - Object containing the IDs of the sub-tasks (`sub_issue_ids`).
	 * @returns {Promise<ITask[]>} - A promise that resolves to an array of updated tasks
	 * @throws {BadRequestException} - Throws an exception in case of an update error.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Add children to Issue' })
	@Post(':id/sub-issues')
	async addChildrenToIssue(
		@Param('id') id: ID,
		@Body() input: UpdateIssueDTO,
	): Promise<ISubIssueResponse> {
		return await this._issueService.updateRelationnalIssueParent(id, input);
	}

	/**
	 * @description Add issue to Module
	 * @param {ID} id - Issue ID for asssign module
	 * @param {IIssueCreateInput} input - data for updating issue
	 * @returns A promise resoved to updated Issue
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Add issue to module' })
	@Post(':id/modules')
	async addIssueToModule(
		@Param('id') id: ID,
		@Body() input: UpdateIssueDTO,
	): Promise<IIssue> {
		return await this._issueService.update(id, input);
	}

	/**
	 * @description Create issue comment
	 * @param {ID} entityId - Issue ID for creating comment
	 * @param {ID} projectId - Project ID for returning project data
	 * @param {CreateIssueCommentDTO} input - Body request
	 * @returns A promise resoved to comment created and returned related data
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue Comment' })
	@Post(':id/comments')
	async createComment(
		@Param('id') entityId: ID,
		@Param('projectId') projectId: ID,
		@Body() input: CreateIssueCommentDTO,
	): Promise<IIssueComment> {
		return await this._issueService.createComment(
			entityId,
			projectId,
			input,
		);
	}

	/**
	 * @description Create Issue reaction
	 * @param {ID} entityId - Issue ID for whom create reaction.
	 * @param {ID} projectId - The project ID for returning project data.
	 * @param {CreateIssueReactionDTO} input -  Body request data
	 * @returns A promise resolved to created and transformed reaction.
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue Reaction' })
	@Post(':id/reactions')
	async createReaction(
		@Param('id') entityId: ID,
		@Param('projectId') projectId: ID,
		@Body() input: CreateIssueReactionDTO,
	): Promise<IReactionData> {
		return await this._issueService.createReaction(
			entityId,
			projectId,
			input,
		);
	}

	/**
	 * @description Create Issue Link
	 * @param {ID} id - Issue ID for whom create link
	 * @param {ID} projectId - The project ID for returning project data
	 * @param {CreateIssueLinkDTO} input - Body request data
	 * @returns A promise resolved to created and transformed link
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue Link' })
	@Post(':id/issue-links')
	async createLink(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID,
		@Body() input: CreateIssueLinkDTO,
	): Promise<IIssueLink> {
		return await this._issueService.createLink(id, projectId, input);
	}

	/**
	 * @description Create issue relations.
	 * @param {ID} taskToId Issue ID for whom to create main relations.
	 * @param {ICreateIssueRelationInput} input - Body request data for creating main and inversed relations.
	 * @returns A promise resolved to created and transformed main relations.
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Issue Relation' })
	@Post(':id/issue-relation')
	async createIssueRelations(
		@Param('id') taskToId: ID,
		@Body() input: CreateIssueRelationDTO,
	) {
		return await this._issueService.createIssueRelations(taskToId, input);
	}

	/**
	 * @description Delete issue relation.
	 * @param {ID} taskToId Issue ID for whom to delete main relation.
	 * @param {ICreateIssueRelationInput} input - Body request data for delete main and inversed relation.
	 * @returns A promise resolved to deleted result.
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete Issue Relation' })
	@Post(':id/remove-relation')
	async deleteIssueRelation(
		@Param('id') taskToId: ID,
		@Body() input: DeleteIssueRelationDTO,
	) {
		return await this._issueService.deleteIssueRelation(taskToId, input);
	}

	/**
	 * @description Create issue comment
	 * @param {ID} id - Comment ID to be updated
	 * @param {ID} projectId - Project ID for find details
	 * @param {ICreateCommentInput} input - Body Request data
	 * @param {ID} entityId
	 * @returns A promise resolved to updated comment and details
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update Issue comment' })
	@Patch(':id/comments/:commentId')
	async updateComment(
		@Body() input: CreateIssueCommentDTO,
		@Param('id') entityId: ID,
		@Param('commentId') id: ID,
		@Param('projectId') projectId: ID,
	): Promise<IIssue> {
		return await this._issueService.updateComment(
			id,
			projectId,
			input,
			entityId,
		);
	}

	/**
	 * @description Update Issue Link
	 * @param {ID} linkId - Link ID to update update
	 * @param {ID} issueId - Issue ID for whom update link
	 * @param {ID} projectId - The project ID for returning project data
	 * @param {CreateIssueLinkDTO} input - Body request data
	 * @returns A promise resolved to created and transformed link
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update Issue Link' })
	@Patch(':id/issue-links/:linkId')
	async updateLink(
		@Body() input: CreateIssueLinkDTO,
		@Param('id') issueId: ID,
		@Param('linkId') linkId: ID,
		@Param('projectId') projectId: ID,
	): Promise<IIssueLink> {
		return await this._issueService.updateLink(
			linkId,
			issueId,
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

	/**
	 * @description Delete issue
	 * @param {ID} id - The issue ID to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete issue' })
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return await this._issueService.delete(id);
	}

	/**
	 * @description Delete issue comment
	 * @param {ID} id - The issue comment ID to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete issue' })
	@Delete(':id/comments/:commentId')
	async deleteComment(@Param('commentId') id: ID) {
		return await this._issueService.deleteComment(id);
	}

	/**
	 * @description Delete issue reaction
	 * @param {ID} issueId - The issue ID from to delete reaction
	 * @param {string} emoji - The emoji to be deleted
	 * @returns A promise resolved to deleted reaction result
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete issue reaction' })
	@Delete(':id/reactions/:emoji')
	async deleteReaction(
		@Param('id') issueId: ID,
		@Param('emoji') emoji: string,
	) {
		return await this._issueService.deleteIssueReactionByEmoji(
			emoji,
			issueId,
		);
	}

	/**
	 * @description Delete Issue Link.
	 * @param {ID} linkId - Issue Link ID to delete
	 * @returns A promise resolved to deleted result
	 * @memberof IssuesController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete issue link' })
	@Delete(':id/issue-links/:linkId')
	async deleteLink(@Param('linkId') linkId: ID) {
		return await this._issueService.deleteLink(linkId);
	}
}
