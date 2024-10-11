import {
	ICreateViewInput,
	ID,
	IGetTasksByViewFilters,
	ITaskViewCreateInput,
	TaskPriorityEnum,
	TaskStatusEnum,
	VisibilityLevelEnum,
} from '@plane-plugin/models';

/**
 * @description Transform filters from incoming Body Request To 'queryParams' To be sent to external API
 * @param {ICreateViewInput['filters']} filters - Accepted filters  for quering data
 * @returns {IGetTasksByViewFilters} - A transformed object that matched external API naming
 */
export function filtersToQueryParams(
	filters: ICreateViewInput['filters'],
): IGetTasksByViewFilters {
	const {
		assignees = [],
		created_by = [],
		cycle = [],
		labels = [],
		module = [],
		priority = [],
		project = [],
		start_date = [],
		state = [],
		state_group = [],
		// subscriber = [], To be added in external API
		target_date = [],
	} = filters;

	return {
		projects: project,
		modules: module,
		tags: labels,
		statusIds: state,
		statuses: state_group as TaskStatusEnum[],
		priorities: priority as TaskPriorityEnum[],
		sprints: cycle,
		members: assignees,
		startDates: start_date.map((date) => new Date(date)),
		dueDates: target_date.map((date) => new Date(date)),
		creators: created_by,
	};
}

/**
 * @description Transform data from incoming body request to accepted naming of external API
 * @param {ICreateViewInput} view - Incoming Body Request
 * @param {ID} [organizationId] - Optional Organization ID (If view belongs to specific Organization)
 * @param {ID} [projectId] - Optional Project ID (If view belongs to specific Project)
 * @param {ID} [moduleId] - Optional Module ID (If view belongs to specific Module)
 * @param {ID} [sprintId] - Optional Sprint ID (If view belongs to specific Sprint)
 * @returns {ITaskViewCreateInput} A transformed body request
 */
export function createViewInputTransformer(
	view: ICreateViewInput,
	organizationId?: ID,
	projectId?: ID,
	moduleId?: ID,
	sprintId?: ID,
): ITaskViewCreateInput {
	const {
		filters,
		display_filters,
		display_properties,
		name,
		access,
		description,
	} = view;

	const visibilityLevel =
		access === 1
			? VisibilityLevelEnum.TEAM_AND_PROJECT
			: VisibilityLevelEnum.ORGANIZATION;

	const queryParams = filtersToQueryParams(filters);

	return {
		name,
		description,
		visibilityLevel,
		queryParams,
		filterOptions: filters,
		displayOptions: display_filters,
		properties: display_properties as Record<string, boolean>,
		organizationId,
		projectId,
		organizationSprintId: sprintId,
		projectModuleId: moduleId,
	};
}
