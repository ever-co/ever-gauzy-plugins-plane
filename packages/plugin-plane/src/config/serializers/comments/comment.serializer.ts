import {
	BaseEntityEnum,
	IComment,
	ICommentCreateInput,
	ICommentUpdateInput,
	ICreateCommentInput,
	ID,
	IEmployee,
	IIssue,
	IIssueComment,
	IOrganizationProject,
	IReactionData,
	IWorkspaceInfo,
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';
import { getProjectsResponse } from '../projects';
import { ActorTypeEnum } from 'packages/models/src/imports/base-entity.model';
import { extractEmployeeMentionIds } from '../../utils';

export function issueCommentTrasnsformer(
	comments: IComment[] | IComment,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspace_detail: IWorkspaceInfo,
	reactions: IReactionData[],
): IIssueComment[] | IIssueComment {
	const transformIssueComment = (comment: IComment): IIssueComment => {
		return {
			id: comment.id,
			issue_detail: issue,
			actor_detail: {
				id: actor?.id,
				first_name: actor?.user?.firstName,
				last_name: actor?.user?.lastName,
				avatar: actor?.user?.imageUrl,
				is_bot: false,
				display_name: actor?.fullName,
			},
			project_detail: getProjectsResponse([project])[0],
			workspace_detail,
			comment_reactions: reactions,
			created_at: comment.createdAt,
			updated_at: comment.updatedAt,
			deleted_at: comment.deletedAt,
			comment_stripped: comment.comment,
			comment_json: {},
			comment_html: comment.comment,
			attachments: [],
			access: 'INTERNAL',
			external_source: null,
			external_id: null,
			created_by: comment.creatorId,
			updated_by: null,
			project: project.id,
			workspace: workspace_detail.id,
			issue: issue.id,
			actor: actor?.id,
		};
	};

	if (Array.isArray(comments)) {
		return comments.map(transformIssueComment);
	}

	return transformIssueComment(comments);
}

/**
 * Transforms the input from the front-end into a format suitable for creating a comment.
 *
 * @param input - The comment input data from the front-end.
 * @param entity - The type of entity associated with the comment (e.g., Task, Project).
 * @param entityId - The ID of the associated entity.
 * @param employees - Optional list of employees for mapping mentioned employee IDs to user IDs.
 * @returns The transformed comment input ready for back-end processing.
 */
export function createCommentInputTransformer(
	input: ICreateCommentInput,
	entity: BaseEntityEnum,
	entityId: ID,
	employees?: IEmployee[],
): ICommentCreateInput {
	const commentHtml = input.comment_html;

	// Extract employee IDs mentioned in the comment
	const mentionedEmployeeIds = extractEmployeeMentionIds(commentHtml);

	// Map employee IDs to user IDs
	const mentionedUserIds = employees
		?.filter(({ id }) => mentionedEmployeeIds.includes(id)) // Filter only employees who are mentioned
		.map((employee) => employee.userId) // Map to corresponding user IDs
		.filter((userId): userId is ID => !!userId); // Ensure user IDs are valid (non-null/undefined)

	return {
		entity,
		entityId,
		comment: commentHtml,
		actorType: ActorTypeEnum.User,
		mentionIds: mentionedUserIds ?? [], // Default to an empty array if no employees are provided
	};
}

export function updateCommentInputTransformer(
	input: ICreateCommentInput,
	commentUpdate: IComment,
): ICommentUpdateInput {
	return {
		...commentUpdate,
		comment: input.comment_html,
	};
}

export function getCommentsQuery(
	entityId?: ID,
	entity?: BaseEntityEnum,
): Record<string, string> {
	// Tenant and Organization based query
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery(),
	};

	if (entityId) {
		query['where[entityId]'] = entityId;
	}

	if (entity) {
		query['where[entity]'] = entity;
	}

	return query;
}
