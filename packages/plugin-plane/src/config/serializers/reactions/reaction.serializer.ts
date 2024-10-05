import {
	ICreateReactionInput,
	ID,
	IEmployee,
	// IIssue,
	// IIssueComment,
	IOrganizationProject,
	IReaction,
	IReactionCreateInput,
	IReactionData,
	IWorkspaceInfo,
	ReactionEntityEnum,
} from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

export function reactionTransformer(
	reactions: IReaction,
	actor: IEmployee,
	project: IOrganizationProject,
	workspace_detail: IWorkspaceInfo,
	// issue?: IIssue,
	// comment?: IIssueComment,
): IReactionData[] | IReactionData {
	const transformReaction = (reaction: IReaction): IReactionData => {
		return {
			id: reaction.id,
			reaction: reaction.emoji,
			actor_detail: {
				id: actor.id,
				first_name: actor.user.firstName,
				last_name: actor.user.lastName,
				avatar: actor.user.imageUrl,
				is_bot: false,
				display_name: actor.fullName,
			},
			created_at: reaction.createdAt,
			updated_at: reaction.updatedAt,
			deleted_at: reaction.deletedAt,
			created_by: reaction.creatorId,
			updated_by: null,
			project: project.id,
			workspace: workspace_detail.id,
			actor: actor.id,
			issue:
				reaction.entity === ReactionEntityEnum.Task
					? reaction.entityId
					: null,
			comment:
				reaction.entity === ReactionEntityEnum.Comment
					? reaction.entityId
					: null,
		};
	};

	if (Array.isArray(reactions)) {
		return reactions.map(transformReaction);
	}

	return transformReaction(reactions);
}

export function createReactionInputTransformer(
	input: ICreateReactionInput,
	entity: ReactionEntityEnum,
	entityId: ID,
): IReactionCreateInput {
	return {
		entity,
		entityId,
		emoji: input.reaction,
	};
}

export function getReactionsQuery(
	entityId?: ID,
	entity?: ReactionEntityEnum,
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
