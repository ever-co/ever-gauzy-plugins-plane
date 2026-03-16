import {
	ICreateViewInput,
	ID,
	IGetTasksByViewFilters,
	ITaskView,
	ITaskViewCreateInput,
	ITaskViewUpdateInput,
	IUpdateViewInput,
	IView,
	IViewPropsDisplayFilters,
	IViewPropsFilters,
	TaskPriorityEnum,
	TaskStatusEnum,
	VisibilityLevelEnum
} from '@ever-gauzy/plugin-integration-plane-models';
import { baseGetItemsWhereQuery } from '../query-params.serializers';

/**
 * @description Transform filters from incoming Body Request To 'queryParams' To be sent to external API
 * @param {ICreateViewInput['filters']} filters - Accepted filters  for quering data
 * @returns {IGetTasksByViewFilters} - A transformed object that matched external API naming
 */
export function filtersToQueryParams(
	filters: ICreateViewInput['filters'] | ICreateViewInput['rich_filters']
): IGetTasksByViewFilters {
	const {
		assignees = [],
		created_by = [],
		cycle = [],
		cycle_id__in = [],
		labels = [],
		module = [],
		module_id__in = [],
		state_id__in = [],
		state_group__in = [],
		assignee_id__in = [],
		priority__in = [],
		label_id__in = [],
		start_date__exact = [],
		target_date__exact = [],
		priority = [],
		project = [],
		start_date = [],
		state = [],
		state_group = [],
		// subscriber = [], To be added in external API
		target_date = []
	} = filters as IViewPropsFilters;

	return {
		projects: project,
		modules: module || module_id__in,
		tags: labels || label_id__in,
		statusIds: state || state_id__in,
		statuses: (state_group || state_group__in) as TaskStatusEnum[],
		priorities: (priority || priority__in) as TaskPriorityEnum[],
		sprints: cycle_id__in || cycle,
		members: assignees || assignee_id__in,
		startDates: (start_date || start_date__exact).map(
			(date) => new Date(date)
		),
		dueDates: (target_date || target_date__exact).map(
			(date) => new Date(date)
		),
		creators: created_by
	};
}

/**
 * @description Transform queryParams from external API Response to 'filters' for internal use
 * @param {IGetTasksByViewFilters} queryParams - The transformed object from external API
 * @returns {ICreateViewInput['filters']} - An object that matches internal API naming
 */
export function queryParamsToFilters(
	queryParams: IGetTasksByViewFilters
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
		creators = []
	} = queryParams;

	return {
		project: projects,
		module: modules,
		module_id__in: modules,
		labels: tags,
		label_id__in: tags,
		state: statusIds,
		state_id__in: statusIds,
		state_in: statusIds,
		state_group: statuses as string[], // assuming statuses are internally handled as strings
		state_group__in: statuses as string[],
		priority: priorities as string[], // assuming priorities are internally handled as strings
		priority__in: priorities as string[],
		cycle: sprints,
		cycle_id__in: sprints,
		assignees: members,
		assignee_id__in: members,
		start_date: startDates as string[],
		start_date__exact: startDates as string[],
		start_date__range: startDates as string[],
		target_date: dueDates as string[],
		target_date__exact: dueDates as string[],
		created_by: creators
	};
}

/**
 * @description Transform create data from incoming body request to accepted naming of external API
 * @param {ICreateViewInput} view - Incoming Body Request
 * @param {ID} [organizationId] - Optional Organization ID (If view belongs to specific Organization)
 * @param {ID} [projectId] - Optional Project ID (If view belongs to specific Project)
 * @param {ID} [moduleId] - Optional Module ID (If view belongs to specific Module)
 * @param {ID} [sprintId] - Optional Sprint ID (If view belongs to specific Sprint)
 * @returns {ITaskViewCreateInput} A transformed body request
 */
export function createViewInputTransformer(
	view: ICreateViewInput,
	projectId?: ID,
	organizationId?: ID,
	moduleId?: ID,
	sprintId?: ID
): ITaskViewCreateInput {
	const {
		filters,
		rich_filters,
		display_filters,
		display_properties,
		name,
		access,
		description
	} = view;

	const visibilityLevel =
		access === 1
			? VisibilityLevelEnum.TEAM_AND_PROJECT
			: VisibilityLevelEnum.ORGANIZATION;

	const queryParams = filtersToQueryParams(rich_filters || filters);

	return {
		name,
		description,
		visibilityLevel,
		queryParams,
		filterOptions: rich_filters || filters,
		displayOptions: display_filters,
		properties: display_properties as Record<string, boolean>,
		organizationId,
		projectId,
		organizationSprintId: sprintId,
		projectModuleId: moduleId
	};
}

/**
 * @description Transform update data from incoming body request to accepted naming of external API
 * @param {IUpdateViewInput} view - Incoming Body Request
 * @param {ID} [organizationId] - Optional Organization ID (If view belongs to specific Organization)
 * @param {ID} [projectId] - Optional Project ID (If view belongs to specific Project)
 * @param {ID} [moduleId] - Optional Module ID (If view belongs to specific Module)
 * @param {ID} [sprintId] - Optional Sprint ID (If view belongs to specific Sprint)
 * @returns {ITaskViewUpdateInput} A transformed body request
 */
export function updateViewInputTransformer(
	view: IUpdateViewInput,
	projectId?: ID,
	organizationId?: ID,
	moduleId?: ID,
	sprintId?: ID
): ITaskViewUpdateInput {
	// Default values if some properties are missing
	const defaultView: ICreateViewInput = {
		filters: {},
		rich_filters: {},
		display_filters: {},
		display_properties: {},
		name: view.name
	};

	// Merge partial `view` with default values
	const completeView = { ...defaultView, ...view };

	// Reuse of create transform function
	return createViewInputTransformer(
		completeView,
		projectId,
		moduleId,
		sprintId,
		organizationId
	);
}

/**
 * @description Transform Task View From external API to issue view for internal use
 * @param {(ITaskView | ITaskView[])} taskViews - External API Task view(s)
 * @param {ID[]} [favoriteIds] - User favorites list
 * @returns  {(IView | IView[])} An array of or a single Issue View
 */
export function issueViewTransformer(
	taskViews: ITaskView | ITaskView[],
	favoriteIds?: ID[]
): IView | IView[] {
	const transformIssueView = (taskView: ITaskView): IView => {
		const isFavorite = favoriteIds?.includes(taskView.id);

		return {
			id: taskView.id,
			created_at: taskView.createdAt,
			updated_at: taskView.updatedAt,
			deleted_at: taskView.deletedAt,
			is_favorite: isFavorite,
			name: taskView.name,
			description: taskView.description,
			query: queryParamsToFilters(
				taskView.queryParams as IGetTasksByViewFilters
			),
			filters: taskView.filterOptions as IViewPropsFilters,
			rich_filters: taskView.filterOptions as IViewPropsFilters,
			display_filters:
				taskView.displayOptions as IViewPropsDisplayFilters,
			display_properties: taskView.properties,
			access: taskView.visibilityLevel, // TODO : Use some transforms here
			sort_order: 9, // TODO : Search for usescase and use right value
			logo_props: {},
			is_locked: taskView.isLocked,
			created_by: '', // TODO : Make sure we have this working
			updated_by: '', // TODO : Make sure we have this working
			workspace: taskView.organizationId,
			project: taskView.projectId,
			owned_by: '' // TODO : Make sure we have this working
		};
	};

	if (Array.isArray(taskViews)) {
		return taskViews.map(transformIssueView);
	}

	return transformIssueView(taskViews);
}

export const viewRelations = [
	'project',
	'organizationTeam',
	'projectModule',
	'organizationSprint'
];

/**
 * @description Query params for getting views
 * @param {ID} [projectId] - Optional Project ID to get views by Project filter
 * @returns {Record<string, string>} A object with queries filters and relations
 */
export function getViewsQuery(
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
		viewRelations.forEach((relation, i) => {
			query[`relations[${i}]`] = relation;
		});
	}

	return query;
}
