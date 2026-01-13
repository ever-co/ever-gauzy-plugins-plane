import { IMentionFindInput } from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

export function getMentionsQuery(
	options: Partial<IMentionFindInput>
): Record<string, string> {
	// Tenant and Organization based query
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery()
	};

	if (options?.entityId) {
		query['where[entityId]'] = options.entityId;
	}

	if (options?.entity) {
		query['where[entity]'] = options?.entity;
	}

	if (options?.parentEntityId) {
		query['where[parentEntityId]'] = options?.parentEntityId;
	}

	if (options?.parentEntityType) {
		query['where[parentEntityType]'] = options?.parentEntityType;
	}

	return query;
}
