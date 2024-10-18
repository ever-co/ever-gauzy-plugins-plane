import {
	CycleStatusEnum,
	ICycle,
	ID,
	IOrganizationSprint,
	IOrganizationSprintCreateInput,
	IOrganizationSprintUpdateInput,
	OrganizationSprintStatusEnum,
} from '@plane-plugin/models';
import moment from 'moment';
import { defaultEmployeeId, defaultOrganizationId } from '../../credentials';
import { getTaskCounts } from '../modules';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

/**
 * Converts a cycle status to the corresponding sprint status.
 *
 * @param {CycleStatusEnum} cycleStatus - The cycle status to convert.
 * @returns {OrganizationSprintStatusEnum} The corresponding sprint status.
 * @throws Will throw an error if the cycle status is not recognized.
 */
export function cycleStatusToSprintStatus(
	cycleStatus: CycleStatusEnum,
): OrganizationSprintStatusEnum {
	const cycleStatusMap: {
		[key: string]: OrganizationSprintStatusEnum;
	} = {
		[CycleStatusEnum.COMPLETED]: OrganizationSprintStatusEnum.COMPLETED,
		[CycleStatusEnum.CURRENT]: OrganizationSprintStatusEnum.ACTIVE,
		[CycleStatusEnum.DRAFT]: OrganizationSprintStatusEnum.DRAFT,
		[CycleStatusEnum.UPCOMING]: OrganizationSprintStatusEnum.UPCOMING,
	};

	const sprintStatus = cycleStatusMap[cycleStatus];
	if (!sprintStatus) {
		throw new Error(`Unrecognized cycle status: ${cycleStatus}`);
	}

	return sprintStatus;
}

/**
 * Converts a sprint status to the corresponding cycle status.
 *
 * @param {OrganizationSprintStatusEnum} sprintStatus - The sprint status to convert.
 * @returns {CycleStatusEnum} The corresponding cycle status.
 * @throws Will throw an error if the sprint status is not recognized.
 */
export function sprintStatusToCycleStatus(
	sprintStatus: OrganizationSprintStatusEnum,
): CycleStatusEnum {
	const cycleStatusMap: {
		[key: string]: CycleStatusEnum;
	} = {
		[OrganizationSprintStatusEnum.COMPLETED]: CycleStatusEnum.COMPLETED,
		[OrganizationSprintStatusEnum.ACTIVE]: CycleStatusEnum.CURRENT,
		[OrganizationSprintStatusEnum.DRAFT]: CycleStatusEnum.DRAFT,
		[OrganizationSprintStatusEnum.UPCOMING]: CycleStatusEnum.UPCOMING,
	};

	const cycleStatus = cycleStatusMap[sprintStatus];
	if (!cycleStatus) {
		throw new Error(`Unrecognized sprint status: ${sprintStatus}`);
	}

	return cycleStatus;
}

/**
 * Calculates the number of days between two dates, including both start and end dates to return the cycle length.
 *
 * @param {string | Date} startDate - The start date in format YYYY-MM-DD.
 * @param {string | Date} endDate - The end date in format YYYY-MM-DD.
 * @returns {number} The total number of days between the two dates, inclusive.
 */
function calculateDaysBetween(
	startDate: string | Date,
	endDate: string | Date,
): number {
	const start = moment(startDate);
	const end = moment(endDate);

	// Days difference (non inclusive)
	const diffDays = end.diff(start, 'days');

	// Include start and end dates
	return diffDays + 1;
}

/**
 * Determines the cycle status based on the start and end dates.
 *
 * @param {Date} startDate - The start date of the cycle.
 * @param {Date} endDate - The end date of the cycle.
 * @returns {OrganizationSprintStatusEnum} The appropriate cycle status based on the dates.
 */
function determineCycleStatus(
	startDate: Date,
	endDate: Date,
): OrganizationSprintStatusEnum {
	const today = moment(); // Current date

	const start = moment(startDate);
	const end = moment(endDate);

	if (start.isAfter(today)) {
		// If the start date is in the future
		return OrganizationSprintStatusEnum.UPCOMING;
	}

	if (start.isSameOrBefore(today) && end.isSameOrAfter(today)) {
		// If the start date is today or in the past and the end date has not passed yet
		return OrganizationSprintStatusEnum.ACTIVE;
	}

	if (end.isBefore(today)) {
		// If the end date has already passed
		return OrganizationSprintStatusEnum.COMPLETED;
	}

	// Default case (you could also throw an error if no case matches)
	return OrganizationSprintStatusEnum.DRAFT;
}

/**
 * Transforms a cycle object into an input suitable for creating an organization sprint.
 *
 * @param {ICycle} cycle - The cycle object containing information about the sprint.
 * @returns {IOrganizationSprintCreateInput} - The transformed input for creating the sprint.
 */
export function createCycleInputTransformer(
	cycle: ICycle,
): IOrganizationSprintCreateInput {
	const { name, description, project_id, start_date, end_date } = cycle;

	// Calculate the cycle length
	const length = calculateDaysBetween(start_date, end_date);

	// Determine the current status of the cycle
	const status = determineCycleStatus(start_date, end_date);

	return {
		name,
		goal: description,
		startDate: start_date,
		endDate: end_date,
		status,
		length,
		projectId: project_id,
		organizationId: defaultOrganizationId(),
		managerIds: [defaultEmployeeId()], // TODO : Change this and retrive it from authorization Request Header or Body Request
		memberIds: [defaultEmployeeId()], // TODO : Change this and get it from Request
	};
}

/**
 * Transforms a cycle object into an input suitable for updating an organization sprint.
 *
 * @param {ICycle} cycle - The cycle object containing information about the sprint.
 * @returns {IOrganizationSprintUpdateInput} - The transformed input for updating the sprint.
 */
export function updateCycleInputTransformer(
	cycle: ICycle,
): IOrganizationSprintUpdateInput {
	const {
		name,
		description,
		project_id,
		start_date,
		end_date,
		status: cycleStatus,
	} = cycle;

	// Calculate the cycle length
	const length = calculateDaysBetween(start_date, end_date);

	// Determine the status of the cycle
	const status = cycleStatusToSprintStatus(cycleStatus);

	return {
		memberIds: cycle.assignee_ids,
		goal: description,
		startDate: start_date,
		endDate: end_date,
		name,
		length,
		managerIds: [cycle.owned_by_id],
		sprintProgress: cycle.progress_snapshot,
		projectId: project_id,
		status,
	};
}

/**
 * @description Transform sprints from external API to accpeted data for internal use
 * @param {(IOrganizationSprint | IOrganizationSprint[])} sprints - External Sprints
 * @param {ID[]} [favoriteIds] - User favorites list
 * @returns {(ICycle | ICycle[])} An array of or single Cycle
 */
export function cycleTransformer(
	sprints: IOrganizationSprint | IOrganizationSprint[],
	favoriteIds?: ID[],
): ICycle | ICycle[] {
	const transformCycle = (sprint: IOrganizationSprint): ICycle => {
		const isFavorite = favoriteIds?.includes(sprint.id);
		const status = sprintStatusToCycleStatus(sprint.status);
		const { completedIssues } = getTaskCounts(
			sprint.toSprintTaskHistories.length > 0
				? sprint.toSprintTaskHistories
				: sprint.tasks,
		);

		return {
			id: sprint.id,
			name: sprint.name,
			description: sprint.goal,
			start_date: sprint.startDate,
			end_date: sprint.endDate,
			status,
			version: 1, // TODO : Add for external API if needed,
			sort_order: 0,
			progress_snapshot: sprint.sprintProgress as Record<string, any>,
			is_favorite: isFavorite,
			total_issues:
				sprint.toSprintTaskHistories.length > 0
					? sprint.toSprintTaskHistories.length
					: sprint.tasks.length,
			completed_issues: completedIssues,
			sub_issues: 0, // TODO : Search how it's mapped
			owned_by_id: sprint.members.find((member) => member.roleId).id,
			created_by: defaultEmployeeId(), // TODO: Make this consistent and add to external API
			project_id: sprint.projectId,
			workspace_id: sprint.tenantId,
			view_props: {},
			logo_props: {},
			assignee_ids: sprint.members.map((member) => member.employeeId),
			external_id: null,
			external_source: null,
		};
	};

	if (Array.isArray(sprints)) {
		return sprints.map(transformCycle);
	}

	return transformCycle(sprints);
}

const cycleRelations = [
	'project',
	'toSprintTaskHistories',
	'fromSprintTaskHistories',
	'tasks',
	'taskSprints',
	'taskSprints.task',
	'members',
	'members.employee',
	'members.employee.user',
];

/**
 * @description Query params for getting sprints
 * @param {ID} [projectId] - Optional Project ID to get sprints by Project filter
 * @returns {Record<string, string>} A object with queries filters and relations
 */
export function getSprintsQuery(projectId?: ID): Record<string, string> {
	// Tenant and Organization based Query
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery(),
	};

	if (projectId) {
		query['where[projectId]'] = projectId;
	}

	// Add relations
	cycleRelations.forEach((relation, i) => {
		query[`relations[${i}]`] = relation;
	});

	return query;
}
