import {
	ActionTypeEnum,
	IActivityLog,
	ICycle,
	IEmployee,
	IIssue,
	IIssueActivity,
	IIssueActivityFindInput,
	IOrganizationProject,
	IOrganizationProjectModule,
	IOrganizationSprint,
	IResourceLink,
	ITag,
	ITask,
	ITaskLinkedIssue,
	IWorkspaceInfo
} from '@plane-plugin/models';
import { currentTenantId, getCurrentOrganizationSlug } from '../../credentials';
import { getProjectsResponse } from '../projects';
import { statusActivityTransformer } from './status-activities.serializer';
import { assigneesActivityTransformer } from './assignees-activities.serializer';
import { labelsActivityTransformer } from './labels-activities.serializer';
import { modulesActivityTransformer } from './modules-activities.serializer';
import { getIssueRelationType } from '../tasks';
import { actorDetailsTransformer } from '../user';

/**
 * Generates detailed information for a given activity log.
 *
 * @param {IActivityLog} activityLog - The activity log object containing details about the activity.
 * @param {IIssue} issue - The issue related to the activity.
 * @param {IEmployee} actor - The employee who performed the activity.
 * @param {IOrganizationProject} project - The project associated with the activity.
 * @param {IWorkspaceInfo} workspaceDetail - The workspace information where the activity occurred.
 * @returns An object containing detailed information about the activity log.
 */
function activityLogDetails(
	activityLog: IActivityLog,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspaceDetail: IWorkspaceInfo,
	employee: IEmployee
) {
	return {
		issue_detail: issue,
		actor_detail: actorDetailsTransformer(activityLog.employee || employee),
		project_detail: getProjectsResponse([project])[0], // Get the first project detail from the response
		workspace_detail: workspaceDetail,
		created_at: activityLog.createdAt,
		updated_at: activityLog.updatedAt,
		deleted_at: activityLog.deletedAt,
		attachments: [],
		created_by: activityLog.employee?.userId || activityLog.createdByUserId,
		updated_by: null,
		project: project.id,
		workspace: workspaceDetail.id,
		issue: issue.id,
		actor: activityLog.employeeId || employee.id
	};
}

/**
 * Transforms the activity log of an issue into a structured format for easier handling.
 *
 * @param {IActivityLog} activityLog - The activity log object.
 * @param {IIssue} issue - The issue associated with the activity log.
 * @param {IEmployee} actor - The employee who performed the activity.
 * @param {IOrganizationProject} project - The project related to the activity.
 * @param {IWorkspaceInfo} workspaceDetail - Details of the workspace.
 * @param {string} [oldStatusValue] - The previous status value of the issue (optional).
 * @returns {IIssueActivity[]} An array of structured issue activities derived from the activity log.
 */
const transformIssueActivityLog = (
	activityLog: IActivityLog,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspaceDetail: IWorkspaceInfo,
	sprint: IOrganizationSprint | ICycle,
	employee: IEmployee,
	assignees: IEmployee[],
	oldStatusValue?: string
): IIssueActivity[] => {
	const {
		updatedFields = [],
		updatedValues = [],
		previousValues = []
	} = activityLog;

	// Map of activity fields to their corresponding names
	const activityFieldMap: { [key: string]: string } = {
		assignee_ids: 'assignee',
		label_ids: 'labels',
		module_ids: 'module',
		issue_link: 'link',
		issue_reactions: 'reaction',
		cycle_id: 'cycles'
	};

	// Generate details for the activity log
	const activityDetails = activityLogDetails(
		activityLog,
		issue,
		actor,
		project,
		workspaceDetail,
		employee
	);

	// Process updated fields to create activity entries
	const activities = updatedFields
		?.filter(
			(f) => !['taskStatusId', 'members', 'tags', 'modules'].includes(f)
		)
		?.map((field, index) => {
			const transformedField = activityLogFieldTransformer(
				field as keyof ITask
			);
			const activityField =
				activityFieldMap[transformedField] || transformedField;

			// Generate a comment based on the action and field
			const comment =
				activityLog.action === ActionTypeEnum.Created
					? 'created the issue'
					: activityLog.action === ActionTypeEnum.Updated &&
						  activityField === 'assignee'
						? 'added assignee '
						: `updated the ${activityField} to`;

			const oldValue: any = previousValues[index][field];
			const newValue: any =
				activityField === 'cycles'
					? sprint?.name
					: updatedValues[index][field];

			const updatedCycleId = updatedValues.find(
				(value) => 'organizationSprintId' in value
			);
			const cycleNewId = updatedCycleId
				? updatedCycleId['organizationSprintId']
				: null;

			return {
				/**
				 * Unique ID for each activity entry.
				 * The reason for this format is that the front-end generates a unique activity log if two have the same ID.
				 * A UUID generator cannot be used here because the front-end will generate multiple activities for each ID
				 * and store them in the global state. If the API is called multiple times, a new ID will be generated,
				 * which is not yet in the state and thus will be added.
				 */
				id: activityLog.id + index + `${field}`,
				...activityDetails,
				verb: 'updated',
				field:
					activityField === 'state__group' ||
					activityField === 'state_id'
						? 'state'
						: activityField,
				comment,
				old_value: oldValue,
				new_value: newValue,
				old_identifier: null,
				new_identifier: activityField === 'cycles' ? cycleNewId : null
			};
		});

	// Handle task status updates
	if (updatedFields?.includes('taskStatusId')) {
		const { previousEntity, updatedEntity } =
			statusActivityTransformer(activityLog);

		activities.push({
			id: activityLog.id + previousEntity,
			...activityDetails,
			verb: 'updated',
			field: 'state',
			comment: 'updated the state to',
			old_value: oldStatusValue,
			new_value: activityLog.data['status'],
			old_identifier: previousEntity,
			new_identifier: updatedEntity
		});
	}

	// Handle changes in assignees
	if (updatedFields?.includes('members')) {
		const { added, removed } = assigneesActivityTransformer(activityLog);

		if (added) {
			const { members: addedMembers, verb: addedVerb } = added;

			addedMembers.map((member, i) => {
				const assignee = assignees.find(({ id }) => id === member.id);
				console.log({ assignee });
				return activities.push({
					id: activityLog.id + member.userId + i,
					...activityDetails,
					verb: 'updated',
					field: 'assignees',
					comment: `${addedVerb} assignee `,
					old_value: '',
					new_value: assignee?.fullName,
					old_identifier: null,
					new_identifier: member.id
				});
			});
		}

		if (removed) {
			const { members: removedMembers, verb: removedVerb } = removed;

			removedMembers.map((member, i) => {
				const assignee = assignees.find(({ id }) => id === member.id);
				console.log({ assignee });
				return activities.push({
					id:
						activityLog.id +
						member.userId +
						removedMembers.length +
						i,
					...activityDetails,
					verb: 'updated',
					field: 'assignees',
					comment: `${removedVerb} assignee `,
					old_value: assignee?.fullName,
					new_value: null,
					old_identifier: member.id,
					new_identifier: null
				});
			});
		}
	}

	// Handle changes in tags
	if (updatedFields?.includes('tags')) {
		const { added, removed } = labelsActivityTransformer(activityLog);

		if (added) {
			const { tags: addedTags, verb: addedVerb } = added;

			addedTags.map((tag: ITag, i: number) =>
				activities.push({
					id: activityLog.id + tag.id + i,
					...activityDetails,
					verb: 'updated',
					field: 'labels',
					comment: `${addedVerb} label `,
					old_value: '',
					new_value: tag.name,
					old_identifier: null,
					new_identifier: tag.id as any
				})
			);
		}

		if (removed) {
			const { tags: removedTags, verb: removedVerb } = removed;

			removedTags.map((tag: ITag, i: number) =>
				activities.push({
					id: activityLog.id + tag.id + removedTags.length + i,
					...activityDetails,
					verb: 'updated',
					field: 'labels',
					comment: `${removedVerb} label `,
					old_value: tag.name,
					new_value: null,
					old_identifier: tag.id,
					new_identifier: null
				})
			);
		}
	}

	// Handle changes in modules
	if (updatedFields?.includes('modules')) {
		const { added, removed } = modulesActivityTransformer(activityLog);

		if (added) {
			const { modules: addedModules, verb: addedVerb } = added;

			addedModules.map((module: IOrganizationProjectModule, i: number) =>
				activities.push({
					id: activityLog.id + module.id + i,
					...activityDetails,
					verb: addedVerb,
					field: 'modules',
					comment: `added this issue to the module ${module.name} `,
					old_value: '',
					new_value: module.name,
					old_identifier: null,
					new_identifier: module.id as any
				})
			);
		}

		if (removed) {
			const { modules: removedModules, verb: removedVerb } = removed;

			removedModules.map(
				(module: IOrganizationProjectModule, i: number) =>
					activities.push({
						id:
							activityLog.id +
							module.id +
							removedModules.length +
							i,
						...activityDetails,
						verb: removedVerb,
						field: 'modules',
						comment: `removed this issue from module ${module.name}`,
						old_value: module.name,
						new_value: null,
						old_identifier: module.id,
						new_identifier: null
					})
			);
		}
	}

	// Filter out activities without a defined field
	return activities?.filter((log) => log.field !== undefined);
};

/**
 * Generates an array of activities representing the changes made to issue links.
 * It creates an activity log for each log entry, indicating if a link was created, updated, or deleted.
 *
 * @param {IActivityLog[]} activityLogs - The list of activity logs that track changes to the issue link.
 * @param {IResourceLink} link - The resource link associated with the issue.
 * @param {IIssue} issue - The issue related to the activity log.
 * @param {IEmployee} actor - The employee who performed the action (e.g., created, updated, or deleted the link).
 * @param {IOrganizationProject} project - The project to which the issue belongs.
 * @param {IWorkspaceInfo} workspaceDetail - The workspace details where the issue resides.
 * @returns {IIssueActivity[]} An array of issue activities reflecting changes made to the links.
 */
export function issueLinksActivities(
	activityLogs: IActivityLog[],
	link: IResourceLink,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspaceDetail: IWorkspaceInfo,
	employee: IEmployee
): IIssueActivity[] {
	// Map over activity logs and transform each log into an issue activity entry
	const activities = activityLogs.map((activityLog, i) => {
		// Retrieve the detailed activity log info (e.g., timestamp, project, actor, etc.)
		const activityDetails = activityLogDetails(
			activityLog,
			issue,
			actor,
			project,
			workspaceDetail,
			employee
		);

		// Extract and normalize the action performed (verb) to lowercase
		const verb = activityLog.action.toLocaleLowerCase();

		// Build the activity object containing information about the change to the link
		return {
			id: activityLog.id + link.id + i,
			...activityDetails,
			verb,
			field: 'link',
			comment: `${verb} a link`,
			old_value:
				verb === 'created'
					? null
					: (activityLog.previousValues[i]['link'] as any),
			new_value: link.url,
			old_identifier: null,
			new_identifier: link.id
		};
	});

	return activities;
}

export function issueRelationActivities(
	activityLogs: IActivityLog[],
	taskLinkedIssue: ITaskLinkedIssue,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspaceDetail: IWorkspaceInfo,
	employee: IEmployee
): IIssueActivity[] {
	// Map over activity logs and transform each log into an issue activity entry
	const activities = activityLogs.map((activityLog) => {
		// Retrieve the detailed activity log info (e.g., timestamp, project, actor, etc.)
		const activityDetails = activityLogDetails(
			activityLog,
			issue,
			actor,
			project,
			workspaceDetail,
			employee
		);

		// Extract and normalize the action performed (verb) to lowercase
		const verb = activityLog.action.toLocaleLowerCase();

		//Extract field
		const field = getIssueRelationType(taskLinkedIssue.action);

		// Project code
		const projectCode =
			project.code || project.name.slice(0, 4).toUpperCase();

		// Build the activity object containing information about the change to the link
		return {
			id: activityLog.id,
			...activityDetails,
			verb: verb === 'deleted' ? verb : 'updated',
			field,
			comment: `${verb === 'deleted' ? verb : 'added'} ${field} relation`,
			old_value:
				verb === 'created'
					? ''
					: projectCode + '-' + taskLinkedIssue.taskFrom.number,
			new_value:
				verb === 'created'
					? projectCode + '-' + taskLinkedIssue.taskFrom.number
					: '',
			old_identifier: taskLinkedIssue.id,
			new_identifier: taskLinkedIssue.id
		};
	});

	return activities;
}

/**
 * Transforms a list of activity logs or a single activity log for an issue into structured issue activities.
 *
 * @param {IActivityLog[] | IActivityLog} activityLogs - An array of activity logs or a single activity log.
 * @param {IIssue} issue - The issue associated with the activity logs.
 * @param {IEmployee} actor - The employee who performed the activities.
 * @param {IOrganizationProject} project - The project related to the activities.
 * @param {IWorkspaceInfo} workspaceDetail - Details of the workspace.
 * @returns {IIssueActivity[] | IIssueActivity} An array of structured issue activities or a single structured activity.
 */
export function issueActivityLogTransformer(
	activityLogs: IActivityLog[] | IActivityLog,
	issue: IIssue,
	actor: IEmployee,
	project: IOrganizationProject,
	workspaceDetail: IWorkspaceInfo,
	sprint: IOrganizationSprint | ICycle,
	employee: IEmployee,
	assignees: IEmployee[]
): IIssueActivity[] | IIssueActivity {
	if (Array.isArray(activityLogs)) {
		// Combine multiple activity logs into a single array of structured activities
		const combinedLogs = activityLogs
			.map((log) =>
				transformIssueActivityLog(
					log,
					issue,
					actor,
					project,
					workspaceDetail,
					sprint,
					employee,
					assignees
				)
			)
			.reduce((acc, cur) => acc.concat(cur), []);

		return combinedLogs;
	}

	// Transform a single activity log into structured activity
	return transformIssueActivityLog(
		activityLogs,
		issue,
		actor,
		project,
		workspaceDetail,
		sprint,
		employee,
		assignees
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
		createdByUserId: 'created_by',
		isDraft: 'is_draft',
		organizationSprintId: 'cycle_id',
		archivedAt: 'archived_at',
		taskStatus: 'state__group',
		description: 'description',
		members: 'assignee_ids',
		tags: 'label_ids',
		modules: 'module_ids'
	};

	return issueFieldsMap[field];
}

export function getActivityLogsQuery(
	options: IIssueActivityFindInput
): Record<string, string> {
	const { action, employeeId, entity, entityId } = options;

	// Tenant and Organization based query
	const query: Record<string, string> = {
		organizationId: getCurrentOrganizationSlug(),
		tenantId: currentTenantId()
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

	if (employeeId) {
		query['employeeId'] = employeeId;
	}
	query['relations[0]'] = 'employee';

	return query;
}
