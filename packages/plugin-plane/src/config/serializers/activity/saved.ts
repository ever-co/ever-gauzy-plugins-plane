import {
	ActionTypeEnum,
	IActivityLog,
	ID,
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
		assignee_ids: 'assignees',
		label_ids: 'labels',
		module_ids: 'modules',
		issue_link: 'links',
		issue_reactions: 'reactions',
	};

	const logs: IIssueActivity[] = updatedFields.flatMap((field, index) => {
		const transformedField = activityLogFieldTransformer(
			field as keyof ITask,
		);
		const activityField =
			activityFieldMap[transformedField] || transformedField;

		const oldValue: any = previousValues[index][field];
		const newValue: any = updatedValues[index][field];

		const comment =
			activityLog.action === ActionTypeEnum.Created
				? 'created the issue'
				: activityLog.action === ActionTypeEnum.Updated &&
					  activityField === 'assignee'
					? 'added assignee '
					: `updated the ${activityField} to`;

		const createActivity = (
			oldValue: any,
			newValue: any,
			old_identifier: ID,
			new_identifier: ID,
			verb: string,
		): IIssueActivity => ({
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
			comment: comment,
			old_value: oldValue,
			new_value: newValue,
			old_identifier,
			new_identifier,
			verb: verb,
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

		// Vérifier si oldValue ou newValue sont des tableaux
		if (Array.isArray(oldValue) || Array.isArray(newValue)) {
			const activities: IIssueActivity[] = [];
			const maxLength = Math.max(
				oldValue?.length || 0,
				newValue?.length || 0,
			);

			// console.log({ maxLength });
			// console.log({ oldValue, newValue });
			// console.log({ previousValues, updatedValues });

			for (let i = 0; i < maxLength; i++) {
				const oldVal =
					oldValue && oldValue[i] !== undefined
						? oldValue[i]?.name
						: oldValue;

				const oldId =
					oldValue && oldValue[i] !== undefined
						? oldValue[i]?.id
						: oldValue;
				const newVal =
					newValue && newValue[i] !== undefined
						? newValue[i].name
						: newValue;

				const newId =
					newValue && newValue[i] !== undefined
						? newValue[i].id
						: newValue;

				activities.push(
					createActivity(
						oldVal,
						newVal,
						oldId,
						newId,
						activityLog.action.toLowerCase(),
					),
				);
			}
			return activities; // Retourne toutes les activités générées
		}

		// Retourne une seule activité si ce ne sont pas des tableaux
		return [
			createActivity(
				oldValue,
				newValue,
				oldValue,
				newValue,
				activityLog.action.toLowerCase(),
			),
		];
	});

	console.log(logs.length);

	return logs.filter((log) => log !== null); // Retourne le tableau unique avec toutes les activités
};

export function issueActivityLogTransformer(
	activityLogs: IActivityLog[] | IActivityLog,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspaceDetail: IWorkspaceInfo,
): IIssueActivity[] | IIssueActivity {
	if (Array.isArray(activityLogs)) {
		return activityLogs
			.flatMap((activityLog) =>
				transformIssueActivityLog(
					activityLog,
					issue,
					actor,
					project,
					workspaceDetail,
				),
			)
			.reverse()
			.filter(Boolean);
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
