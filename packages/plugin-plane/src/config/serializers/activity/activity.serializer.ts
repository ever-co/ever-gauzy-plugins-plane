import { IIssueActivityFindInput } from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

export function getActivityLogsQuery(
	options: IIssueActivityFindInput,
): Record<string, string> {
	const { action, entity, entityId } = options;

	// Tenant and Organization based query
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery(),
	};

	if (action) {
		query['where[action]'] = action;
	}

	if (entityId) {
		query['where[entityId]'] = entityId;
	}

	if (entity) {
		query['where[entity]'] = entity;
	}

	return query;
}
