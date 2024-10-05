import { ApiOperation } from '@nestjs/swagger';
import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Post,
} from '@nestjs/common';
import { ID, IReactionData } from '@plane-plugin/models';
import { CreateIssueReactionDTO } from '../issues/dto';
import { CommentsService } from './comments.service';

@Controller()
export class CommentsController {
	constructor(private readonly _commentService: CommentsService) {}

	/**
	 * @description Create Comment reaction
	 * @param {ID} entityId - Comment ID for whom create reaction.
	 * @param {ID} projectId - The project ID for returning project data.
	 * @param {CreateCommentReactionDTO} input -  Body request data
	 * @returns A promise resolved to created and transformed reaction.
	 * @memberof CommentsController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Comment Reaction' })
	@Post(':id/reactions')
	async createReaction(
		@Param('id') entityId: ID,
		@Param('projectId') projectId: ID,
		@Body() input: CreateIssueReactionDTO,
	): Promise<IReactionData> {
		return await this._commentService.createReaction(
			entityId,
			projectId,
			input,
		);
	}
}
