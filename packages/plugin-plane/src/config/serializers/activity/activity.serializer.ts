import {
	ActionTypeEnum,
	IActivityLog,
	IEmployee,
	IIssue,
	IIssueActivity,
	IIssueActivityFindInput,
	IOrganizationProject,
	ITask,
	IWorkspaceInfo,
} from '@plane-plugin/models';
import { defaultOrganizationId, defaultTestTenantId } from '../../credentials';
import { getProjectsResponse } from '../projects';

const transformIssueActivityLog = (
	activityLog: IActivityLog,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspaceDetail: IWorkspaceInfo,
): IIssueActivity[] => {
	const { updatedFields, updatedValues, previousValues } = activityLog;

	const activityFieldMap: { [key: string]: string } = {
		assignee_ids: 'assignee',
		label_ids: 'labels',
		module_ids: 'module',
		issue_link: 'link',
		issue_reactions: 'reaction',
	};

	return updatedFields.map((field, index) => {
		const transformedField = activityLogFieldTransformer(
			field as keyof ITask,
		);
		const activityField =
			activityFieldMap[transformedField] || transformedField;

		const comment =
			activityLog.action === ActionTypeEnum.Created
				? 'created the issue'
				: activityLog.action === ActionTypeEnum.Updated &&
					  activityField === 'assignee'
					? 'added assignee '
					: `updated the ${activityField} to`;

		const oldValue: any = previousValues[index][field];
		const newValue: any = updatedValues[index][field];

		return {
			id: activityLog.id,
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
			workspace_detail: workspaceDetail,
			field: activityField,
			comment,
			old_value: oldValue,
			new_value: newValue,
			verb: activityLog.action.toLowerCase(),
			created_at: activityLog.createdAt,
			updated_at: activityLog.updatedAt,
			deleted_at: activityLog.deletedAt,
			attachments: [],
			created_by: activityLog.creatorId,
			updated_by: null,
			project: project.id,
			workspace: workspaceDetail.id,
			issue: issue.id,
			actor: actor?.id,
		};
	});
};

export function issueActivityLogTransformer(
	activityLogs: IActivityLog[] | IActivityLog,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspaceDetail: IWorkspaceInfo,
): IIssueActivity[] | IIssueActivity {
	if (Array.isArray(activityLogs)) {
		return activityLogs.flatMap((activityLog) =>
			transformIssueActivityLog(
				activityLog,
				issue,
				actor,
				project,
				workspaceDetail,
			),
		);
	}

	return transformIssueActivityLog(
		activityLogs,
		issue,
		actor,
		project,
		workspaceDetail,
	);
}

export function activityLogFieldTransformer(field: keyof ITask): keyof IIssue {
	const issueFieldsMap: { [key in keyof ITask]: keyof IIssue } = {
		title: 'name',
		taskStatusId: 'state_id',
		resolvedAt: 'completed_at',
		priority: 'priority',
		startDate: 'start_date',
		dueDate: 'target_date',
		number: 'sequence_id',
		projectId: 'project_id',
		parentId: 'parent_id',
		createdAt: 'created_at',
		updatedAt: 'updated_at',
		creatorId: 'created_by',
		isDraft: 'is_draft',
		organizationSprintId: 'cycle_id',
		archivedAt: 'archived_at',
		taskStatus: 'state__group',
		description: 'description_html',
		members: 'assignee_ids',
		tags: 'label_ids',
		modules: 'module_ids',
	};

	return issueFieldsMap[field];
}

export function getActivityLogsQuery(
	options: IIssueActivityFindInput,
): Record<string, string> {
	const { action, entity, entityId } = options;

	// Tenant and Organization based query
	const query: Record<string, string> = {
		organizationId: defaultOrganizationId(),
		tenantId: defaultTestTenantId(),
	};

	if (action) {
		query['action'] = action;
	}

	if (entityId) {
		query['entityId'] = entityId;
	}

	if (entity) {
		query['entity'] = entity;
	}

	return query;
}
