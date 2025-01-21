import {
	CycleStatusEnum,
	ICycle,
	ICycleAnalytics,
	ICycleIssuesResponse,
	ID,
	IIssue,
	IOrganizationSprint,
	IOrganizationSprintCreateInput,
	IOrganizationSprintUpdateInput,
	ITask,
	OrganizationSprintStatusEnum,
	TaskStatusEnum
} from '@plane-plugin/models';
import moment from 'moment';
import {
	currentEmployeeId,
	getCurrentOrganizationSlug
} from '../../credentials';
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
	cycleStatus: CycleStatusEnum
): OrganizationSprintStatusEnum {
	const cycleStatusMap: {
		[key: string]: OrganizationSprintStatusEnum;
	} = {
		[CycleStatusEnum.COMPLETED]: OrganizationSprintStatusEnum.COMPLETED,
		[CycleStatusEnum.CURRENT]: OrganizationSprintStatusEnum.ACTIVE,
		[CycleStatusEnum.DRAFT]: OrganizationSprintStatusEnum.DRAFT,
		[CycleStatusEnum.UPCOMING]: OrganizationSprintStatusEnum.UPCOMING
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
	sprintStatus: OrganizationSprintStatusEnum
): CycleStatusEnum {
	const cycleStatusMap: {
		[key: string]: CycleStatusEnum;
	} = {
		[OrganizationSprintStatusEnum.COMPLETED]: CycleStatusEnum.COMPLETED,
		[OrganizationSprintStatusEnum.ACTIVE]: CycleStatusEnum.CURRENT,
		[OrganizationSprintStatusEnum.DRAFT]: CycleStatusEnum.DRAFT,
		[OrganizationSprintStatusEnum.UPCOMING]: CycleStatusEnum.UPCOMING
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
	endDate: string | Date
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
	endDate: Date
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
	cycle: ICycle
): IOrganizationSprintCreateInput {
	const { name, description, project_id, start_date, end_date } = cycle;

	// Calculate the cycle length
	const length = calculateDaysBetween(start_date, end_date);

	// Determine the current status of the cycle
	const status = determineCycleStatus(start_date, end_date);

	return {
		name,
		goal: description,
		startDate: new Date(start_date),
		endDate: new Date(end_date),
		status,
		length,
		projectId: project_id,
		organizationId: getCurrentOrganizationSlug(),
		managerIds: [currentEmployeeId()], // TODO : Change this and retrive it from authorization Request Header or Body Request
		memberIds: [currentEmployeeId()] // TODO : Change this and get it from Request
	};
}

/**
 * Transforms a cycle object into an input suitable for updating an organization sprint.
 *
 * @param {ICycle} cycle - The cycle object containing information about the sprint.
 * @returns {IOrganizationSprintUpdateInput} - The transformed input for updating the sprint.
 */
export function updateCycleInputTransformer(
	cycle: ICycle
): IOrganizationSprintUpdateInput {
	const {
		name,
		description,
		project_id,
		start_date,
		end_date,
		status: cycleStatus
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
		status
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
	favoriteIds?: ID[]
): ICycle | ICycle[] {
	const transformCycle = (sprint: IOrganizationSprint): ICycle => {
		const isFavorite = favoriteIds?.includes(sprint.id);
		const status = sprintStatusToCycleStatus(sprint.status);
		const { completedIssues } = getTaskCounts(
			retrieveCycleTotalTasks(sprint)
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
				sprint.toSprintTaskHistories?.length > 0
					? sprint.toSprintTaskHistories?.length
					: sprint.tasks?.length,
			completed_issues: completedIssues,
			sub_issues: 0, // TODO : Search how it's mapped
			owned_by_id: sprint.members?.find((member) => member.roleId)?.id,
			created_by: currentEmployeeId(), // TODO: Make this consistent and add to external API
			project_id: sprint.projectId,
			workspace_id: sprint.organizationId,
			view_props: {},
			logo_props: {},
			assignee_ids: sprint.members?.map((member) => member.employeeId),
			external_id: null,
			external_source: null
		};
	};

	if (Array.isArray(sprints)) {
		return sprints.map(transformCycle);
	}

	return transformCycle(sprints);
}

export const cycleRelations = [
	'project',
	'toSprintTaskHistories',
	'toSprintTaskHistories.task',
	'fromSprintTaskHistories',
	'fromSprintTaskHistories.task',
	'tasks',
	'taskSprints',
	'taskSprints.task',
	'members',
	'members.employee',
	'members.employee.user'
];

/**
 * @description Query params for getting sprints
 * @param {ID} [projectId] - Optional Project ID to get sprints by Project filter
 * @returns {Record<string, string>} A object with queries filters and relations
 */
export function getSprintsQuery(
	projectId?: ID,
	relations?: string[]
): Record<string, string> {
	// Tenant and Organization based Query
	const query: Record<string, string> = {
		...baseGetItemsWhereQuery()
	};

	if (projectId) {
		query['where[projectId]'] = projectId;
	}

	// Add relations
	if (relations) {
		relations.forEach((relation, i) => {
			query[`relations[${i}]`] = relation;
		});
	} else {
		cycleRelations.forEach((relation, i) => {
			query[`relations[${i}]`] = relation;
		});
	}

	return query;
}

export function cycleIssueTransformer(issues: IIssue[]): ICycleIssuesResponse {
	return {
		grouped_by: null,
		sub_grouped_by: null,
		total_count: issues.length,
		next_cursor: '30:1:0',
		prev_cursor: '30:-1:1',
		next_page_results: false,
		prev_page_results: false,
		count: issues.length,
		total_pages: 1,
		total_results: issues.length,
		extra_stats: null,
		results: issues
	};
}

/**
 * Retrieves the total list of unique tasks associated with a given sprint,
 * including tasks from the current sprint, previous sprint histories, and
 * the sprint's directly associated tasks.
 *
 * @param {IOrganizationSprint} sprint - The sprint object containing task histories and tasks.
 * @returns {ITask[]} - An array of unique tasks associated with the sprint.
 *
 * @remarks
 * - The function extracts tasks from the `toSprintTaskHistories` (current sprint tasks),
 *   `fromSprintTaskHistories` (previous sprint tasks), and `tasks` (directly associated tasks).
 * - Tasks are deduplicated based on their `id` property to ensure uniqueness.
 * - If a task exists in multiple sources, the task from `currentTasks` is prioritized
 *   over `previousTasks`.
 */
export function retrieveCycleTotalTasks(sprint: IOrganizationSprint): ITask[] {
	// Get the current sprint tasks from the sprint's toSprintTaskHistories
	const currentTasks = (sprint.toSprintTaskHistories ?? [])
		.filter((history) => history?.task) // Ensure task exists
		.map((history) => history.task); // Transform tasks

	// Get the previous sprint tasks from the sprint's fromSprintTaskHistories
	const previousTasks = (sprint.fromSprintTaskHistories ?? [])
		.filter((history) => history?.task) // Ensure task exists
		.map((history) => history.task); // Transform tasks

	// Combine both current and previous tasks, ensuring uniqueness based on task ID
	return Array.from(
		new Set(
			[...currentTasks, ...previousTasks, ...(sprint.tasks ?? [])].map(
				(task) => task.id
			)
		)
	).map((taskId) => {
		// Find the task from either the current or previous tasks list
		return (
			currentTasks.find((task) => task.id === taskId) ||
			previousTasks.find((task) => task.id === taskId)
		);
	});
}

/**
 * Transforms sprint/cycle data into analytics format, calculating statistics about tasks, assignees, and labels.
 *
 * This function processes a sprint's tasks and their histories to generate comprehensive analytics including:
 * - Task distribution across assignees (including unassigned tasks)
 * - Task distribution across labels (including unlabeled tasks)
 * - Task completion status over time
 *
 * @param {IOrganizationSprint} sprint - The sprint/cycle to analyze, containing:
 *   - tasks: Current tasks in the sprint
 *   - toSprintTaskHistories: History of tasks added to the sprint
 *   - fromSprintTaskHistories: History of tasks removed from the sprint
 *   - members: Sprint team members with their roles
 * @returns {ICycleAnalytics} Analytics data containing:
 *   - assignees: Array of assignee statistics including total, completed and pending issues per assignee
 *   - labels: Array of label statistics including total, completed and pending issues per label
 *   - completion_chart: Daily snapshot of remaining incomplete tasks through sprint duration
 */

export function cycleAnalyticsData(
	sprint: IOrganizationSprint
): ICycleAnalytics {
	const tasks = retrieveCycleTotalTasks(sprint);

	// Initialize stats for unassigned tasks
	const unassignedStats = {
		display_name: null,
		assignee_id: null,
		avatar_url: null,
		total_issues: 0,
		completed_issues: 0,
		pending_issues: 0
	};

	// Initialize stats for unlabeled tasks
	const unlabeledStats = {
		label_name: null,
		color: null,
		label_id: null,
		total_issues: 0,
		completed_issues: 0,
		pending_issues: 0
	};

	// Process assignees
	const assigneeMap = new Map();
	sprint.members.forEach((member) => {
		assigneeMap.set(member.employeeId, {
			display_name: member.employee?.fullName || member.employee?.name,
			assignee_id: member.employeeId,
			avatar_url: member.employee?.user?.imageUrl || '',
			total_issues: 0,
			completed_issues: 0,
			pending_issues: 0
		});
	});

	// Process labels
	const labelMap = new Map();
	tasks.forEach((issue) => {
		issue?.tags?.forEach((label) => {
			if (!labelMap.has(label.id)) {
				labelMap.set(label.id, {
					label_name: label.name,
					color: label.color,
					label_id: label.id,
					total_issues: 0,
					completed_issues: 0,
					pending_issues: 0
				});
			}
		});
	});

	// Calculate statistics
	tasks.forEach((task) => {
		const isCompleted =
			task?.taskStatus.name === TaskStatusEnum.COMPLETED ||
			task?.taskStatus.name === TaskStatusEnum.DONE;

		// Handle unassigned tasks
		if (!task?.members?.length) {
			unassignedStats.total_issues++;
			isCompleted
				? unassignedStats.completed_issues++
				: unassignedStats.pending_issues++;
		}

		// Handle tasks without tags
		if (!task?.tags?.length) {
			unlabeledStats.total_issues++;
			isCompleted
				? unlabeledStats.completed_issues++
				: unlabeledStats.pending_issues++;
		}

		// Update assignee stats
		task?.members?.forEach((assigneeId) => {
			const assignee = assigneeMap.get(assigneeId);
			if (assignee) {
				assignee.total_issues++;
				isCompleted
					? assignee.completed_issues++
					: assignee.pending_issues++;
			}
		});

		// Update label stats
		task?.tags?.forEach((label) => {
			const labelStats = labelMap.get(label.id);
			if (labelStats) {
				labelStats.total_issues++;
				isCompleted
					? labelStats.completed_issues++
					: labelStats.pending_issues++;
			}
		});
	});

	// Generate completion chart
	const completionChart: Record<string, number> = {};
	if (sprint.startDate && sprint.endDate) {
		const start = moment(sprint.startDate);
		const end = moment(sprint.endDate);
		const current = start.clone();

		while (current.isSameOrBefore(end)) {
			const dateStr = current.format('YYYY-MM-DD');
			const remainingTasks = tasks.filter(
				(task) =>
					(task?.taskStatus.name !== TaskStatusEnum.COMPLETED &&
						task?.taskStatus.name !== TaskStatusEnum.DONE) ||
					moment(task.resolvedAt).isAfter(current)
			).length;
			completionChart[dateStr] = remainingTasks;
			current.add(1, 'day');
		}
	}

	return {
		assignees: [...assigneeMap.values(), unassignedStats],
		labels: [...labelMap.values(), unlabeledStats],
		completion_chart: completionChart
	};
}
