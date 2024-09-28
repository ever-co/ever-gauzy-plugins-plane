import {
	CommentEntityEnum,
	ICommentCreateInput,
	ICreateCommentInput,
	ID,
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

export function createCommentInputTransformer(
	input: ICreateCommentInput,
	entity: CommentEntityEnum,
	entityId: ID,
): ICommentCreateInput {
	return {
		entity,
		entityId,
		comment: input.comment_html,
	};
}

export function getCommentsQuery(
	entityId?: ID,
	entity?: CommentEntityEnum,
): Record<string, string> {
	// Tenant and Organization based query
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery,
	};

	if (entityId) {
		query['where[entityId]'] = entityId;
	}

	if (entity) {
		query['where[entity]'] = entity;
	}

	return query;
}
