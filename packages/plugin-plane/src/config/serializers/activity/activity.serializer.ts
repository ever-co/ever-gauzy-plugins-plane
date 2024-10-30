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
import { statusActivityTransformer } from './status-activities.serializer';
import { assigneesActivityTransformer } from './assignees-activities.serializer';

const transformIssueActivityLog = (
	activityLog: IActivityLog,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspaceDetail: IWorkspaceInfo,
	oldStatusValue?: string,
): IIssueActivity[] => {
	const { updatedFields, updatedValues, previousValues } = activityLog;

	const activityFieldMap: { [key: string]: string } = {
		assignee_ids: 'assignee',
		label_ids: 'labels',
		module_ids: 'module',
		issue_link: 'link',
		issue_reactions: 'reaction',
	};

	const activities = updatedFields
		.filter((f) => f !== 'taskStatusId')
		.filter((f) => f !== 'members')
		.map((field, index) => {
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
				/**
				 *@summary Why using this kind for ID ?
				 * @property
				 * The reason is that, firstly, the front-end render a unique activity log if two have the same ID.
				 * We can't use uuid generator here because the front-end will generate as many activities as possible for each ID and put them in the global state then. So if API is called multiple times, new ID will be generated and sent to front-end and it will find that the new generated one is not yet in the state and then will be added.
				 */
				id: activityLog.id + index + `${field}`,
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
				field:
					activityField === 'state__group' ||
					activityField === 'state_id'
						? 'state'
						: activityField,
				comment,
				old_value: oldValue,
				new_value: newValue,
				old_identifier: null,
				new_identifier: null,
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

	if (updatedFields.includes('taskStatusId')) {
		const { previousEntity, updatedEntity } =
			statusActivityTransformer(activityLog);

		activities.push({
			id: activityLog.id + previousEntity,
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
			field: 'state',
			comment: 'updated the state to',
			old_value: oldStatusValue,
			new_value: activityLog.data['status'],
			old_identifier: previousEntity,
			new_identifier: updatedEntity,
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
		});
	}

	if (updatedFields.includes('members')) {
		const { added, removed } = assigneesActivityTransformer(activityLog);

		if (added) {
			const { members: addedMembers, verb: addedVerb } = added;

			addedMembers.map((member, i) =>
				activities.push({
					id: activityLog.id + member.userId + i,
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
					field: 'assignees',
					comment: `${addedVerb} assignee `,
					old_value: '',
					new_value: member.fullName,
					old_identifier: null,
					new_identifier: member.id,
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
				}),
			);
		}

		if (removed) {
			const { members: removedMembers, verb: removedVerb } = removed;

			removedMembers.map((member, i) =>
				activities.push({
					id:
						activityLog.id +
						member.userId +
						removedMembers.length +
						i,
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
					field: 'assignees',
					comment: `${removedVerb} assignee `,
					old_value: member.profile_link,
					new_value: null,
					old_identifier: member.id,
					new_identifier: null,
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
				}),
			);
		}
	}

	return activities.filter((log) => log.field !== undefined);
};

export function issueActivityLogTransformer(
	activityLogs: IActivityLog[] | IActivityLog,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspaceDetail: IWorkspaceInfo,
): IIssueActivity[] | IIssueActivity {
	if (Array.isArray(activityLogs)) {
		const combinedLogs = activityLogs
			.map((log) =>
				transformIssueActivityLog(
					log,
					issue,
					actor,
					project,
					workspaceDetail,
				),
			)
			.reduce((acc, cur) => acc.concat(cur), []);

		return combinedLogs;
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
		description: 'description',
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
