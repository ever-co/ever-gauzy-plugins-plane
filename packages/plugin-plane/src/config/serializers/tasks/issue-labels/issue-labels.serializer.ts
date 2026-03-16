import { ID, IIssueLabel, ITag } from '@ever-gauzy/plugin-integration-plane-models';
import { baseGetItemsWhereQuery } from '../../query-params.serializers';
import { currentTenantId } from '../../../credentials';

export function issueLabelsTransformer(
	issues: ITag[] | ITag,
	projectId: ID
): IIssueLabel[] | IIssueLabel {
	if (Array.isArray(issues)) {
		return issues.map((issue, i) => ({
			id: issue.id,
			parent: null,
			name: issue.name,
			color: issue.color,
			project_id: projectId,
			workspace_id: currentTenantId(),
			sort_order: 65535.0 + i * 1000
		}));
	}

	return {
		id: issues.id,
		parent: null,
		name: issues.name,
		color: issues.color,
		project_id: projectId,
		workspace_id: currentTenantId(),
		sort_order: 65535.0
	};
}

export const getLabelsQuery = () => ({
	...baseGetItemsWhereQuery()
});
