import { ID, IIssueLabel, ITag } from '@plane-plugin/models';
import { baseGetItemsWhereQuery } from '../../query-params.serializers';
import { defaultTestTenantId } from '../../../credentials';

export function issueLabelsTransformer(
	issues: ITag[] | ITag,
	projectId: ID,
): IIssueLabel[] | IIssueLabel {
	if (Array.isArray(issues)) {
		return issues.map((issue, i) => ({
			id: issue.id,
			parent: null,
			name: issue.name,
			color: issue.color,
			project_id: projectId,
			workspace_id: defaultTestTenantId(),
			sort_order: 65535.0 + i * 1000,
		}));
	}

	return {
		id: issues.id,
		parent: null,
		name: issues.name,
		color: issues.color,
		project_id: projectId,
		workspace_id: defaultTestTenantId(),
		sort_order: 65535.0,
	};
}

export const getLabelsQuery = () => ({
	...baseGetItemsWhereQuery(),
});
