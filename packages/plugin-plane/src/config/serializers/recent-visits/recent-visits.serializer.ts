import {
	BaseEntityEnum,
	ID,
	IEmployeeRecentVisit,
	IIssueRecentVisit,
	IOrganizationProject,
	IProjectRecentVisit,
	IRecentVisit,
	ITask,
	TaskTypeEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import { currentTenantId, getCurrentOrganizationSlug } from '../../credentials';

/**
 * Builds a query object for fetching employee recent visits with optional filters and predefined relations.
 *
 * This function generates a query object formatted for APIs that accept filtering via
 * nested query parameters like `where[field]=value` and `relations[index]=relation`.
 *
 * @param {ID} employeeId - The ID of the employee to fetch recent visits for.
 * @returns {Record<string, any>} A query object that can be used in an HTTP request (e.g., for RESTful endpoints).
 */
export function getEmployeeRecentVisitsQuery(
	employeeId: ID
): Record<string, any> {
	const query: Record<string, any> = {
		organizationId: getCurrentOrganizationSlug(),
		tenantId: currentTenantId()
	};

	query['employeeId'] = employeeId;

	return query;
}

/**
 * Transforms a task object to a standardized format.
 *
 * @param {ITask} task - The task object to be transformed.
 * @returns {IIssueRecentVisit} The transformed task object in a standardized format.
 */
export function issueRecentVisitTransformer(task: ITask): IIssueRecentVisit {
	return {
		id: task.id!,
		name: task.title!,
		state: task.taskStatusId!,
		priority: task.priority!,
		assignees: task.members!.map((member) => member.id) as string[],
		type: task.taskType?.name,
		sequence_id: task.number!,
		project_id: task.projectId!,
		project_identifier:
			(task.project?.code || task.project?.name?.slice(0, 4).toUpperCase())!,
		is_epic: task.taskType?.name === TaskTypeEnum.EPIC
	};
}

/**
 * Transforms a project object to a standardized format.
 *
 * @param {IProject} project - The project object to be transformed.
 * @returns {IProjectRecentVisit} The transformed project object in a standardized format.
 */
export function projectRecentVisitTransformer(
	project: IOrganizationProject
): IProjectRecentVisit {
	return {
		id: project.id!,
		name: project.name,
		logo_props: {
			emoji: {
				url: project.imageUrl,
				value: project.icon
			},
			in_use: 'emoji'
		},
		project_members: project.members!.map((member) => member.id) as string[],
		identifier: (project.code || project.name?.slice(0, 4).toUpperCase())!
	};
}

/**
 * Transforms a recent visit object to a standardized format.
 *
 * @param {IEmployeeRecentVisit[] | IEmployeeRecentVisit} recentVisits - The recent visit object to be transformed.
 * @returns {IRecentVisit[] | IRecentVisit} The transformed recent visit object in a standardized format.
 */
export function recentVisitTransformer(
	recentVisits: IEmployeeRecentVisit[] | IEmployeeRecentVisit
): IRecentVisit[] | IRecentVisit {
	/**
	 * Transforms a recent visit object to a standardized format.
	 *
	 * @param {IEmployeeRecentVisit} recentVisit - The recent visit object to be transformed.
	 * @returns {IRecentVisit} The transformed recent visit object in a standardized format.
	 */
	const transformRecentVisit = (
		recentVisit: IEmployeeRecentVisit
	): IRecentVisit => {
		// Get the entity name
		const entityName =
			recentVisit.entity === BaseEntityEnum.Task
				? 'issue'
				: recentVisit.entity === BaseEntityEnum.OrganizationProject
					? 'project'
					: '';

		// Get the entity data
		const entityData =
			recentVisit.entity === BaseEntityEnum.Task
				? issueRecentVisitTransformer(recentVisit.data as ITask)
				: recentVisit.entity === BaseEntityEnum.OrganizationProject
					? projectRecentVisitTransformer(
							recentVisit.data as IOrganizationProject
						)
					: null;

		// Return the transformed recent visit
		return {
			id: recentVisit.id!,
			entity_name: entityName,
			entity_identifier: recentVisit.entityId,
			entity_data: entityData!,
			visited_at: recentVisit.visitedAt
		};
	};

	if (Array.isArray(recentVisits)) {
		return recentVisits.map(transformRecentVisit);
	}

	return transformRecentVisit(recentVisits);
}
