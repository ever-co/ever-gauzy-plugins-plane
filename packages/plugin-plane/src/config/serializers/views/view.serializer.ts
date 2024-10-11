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
 * @description Transform queryParams from external API Response to 'filters' for internal use
 * @param {IGetTasksByViewFilters} queryParams - The transformed object from external API
 * @returns {ICreateViewInput['filters']} - An object that matches internal API naming
 */
export function queryParamsToFilters(
	queryParams: IGetTasksByViewFilters,
): ICreateViewInput['filters'] {
	const {
		projects = [],
		modules = [],
		tags = [],
		statusIds = [],
		statuses = [],
		priorities = [],
		sprints = [],
		members = [],
		startDates = [],
		dueDates = [],
		creators = [],
	} = queryParams;

	return {
		project: projects,
		module: modules,
		labels: tags,
		state: statusIds,
		state_group: statuses as string[], // assuming statuses are internally handled as strings
		priority: priorities as string[], // assuming priorities are internally handled as strings
		cycle: sprints,
		assignees: members,
		start_date: startDates.map((date) => date.toISOString().split('T')[0]), // converting back to string date format
		target_date: dueDates.map((date) => date.toISOString().split('T')[0]), // same here
		created_by: creators,
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
