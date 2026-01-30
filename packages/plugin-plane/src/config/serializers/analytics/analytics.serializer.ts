import {
    ChartXAxisProperty,
    IAdvanceAnalyticsChartResponse,
    IAdvanceAnalyticsResponse,
    IChartDataItem,
    ITask,
    IWorkItemInsightRow,
    TaskStatusEnum
} from '@plane-plugin/models';
import { sluggify } from '../../utils/shared.utils';

/**
 * Status mapping from Gauzy task status to Plane state groups
 */
const statusGroupMap: Record<string, string> = {
	[TaskStatusEnum.DONE.toLowerCase()]: 'completed',
	[TaskStatusEnum.COMPLETED.toLowerCase()]: 'completed',
	[sluggify(TaskStatusEnum.IN_PROGRESS)]: 'started',
	[sluggify(TaskStatusEnum.READY_FOR_REVIEW)]: 'started',
	[sluggify(TaskStatusEnum.IN_REVIEW)]: 'started',
	[sluggify(TaskStatusEnum.BLOCKED)]: 'started',
	[TaskStatusEnum.OPEN.toLowerCase()]: 'unstarted',
	[TaskStatusEnum.BACKLOG.toLowerCase()]: 'backlog',
	cancelled: 'cancelled'
};

/**
 * Get the state group for a given task
 */
function getStateGroup(task: ITask): string {
	// Check taskStatus properties first (more reliable)
	if (task.taskStatus?.isDone) return 'completed';
	if (task.taskStatus?.isInProgress) return 'started';
	if (task.taskStatus?.isTodo) return 'unstarted';

	// Fallback to status string mapping
	const status = task.status ? sluggify(task.status) : '';
	return statusGroupMap[status] || 'unstarted';
}

/**
 * Transform tasks into advance analytics response (counts by state group)
 */
export function transformToAdvanceAnalytics(
	tasks: ITask[]
): IAdvanceAnalyticsResponse {
	const counts = {
		total: 0,
		started: 0,
		backlog: 0,
		unstarted: 0,
		completed: 0
	};

	tasks.forEach((task) => {
		counts.total++;
		const group = getStateGroup(task);

		switch (group) {
			case 'completed':
				counts.completed++;
				break;
			case 'started':
				counts.started++;
				break;
			case 'backlog':
				counts.backlog++;
				break;
			case 'unstarted':
			default:
				counts.unstarted++;
				break;
		}
	});

	return {
		total_work_items: { count: counts.total },
		started_work_items: { count: counts.started },
		backlog_work_items: { count: counts.backlog },
		un_started_work_items: { count: counts.unstarted },
		completed_work_items: { count: counts.completed }
	};
}

/**
 * Transform tasks grouped by assignee into work item stats rows
 */
export function transformToWorkItemStats(
	tasks: ITask[]
): IWorkItemInsightRow[] {
	// Group tasks by assignee
	const assigneeMap = new Map<
		string,
		{ tasks: ITask[]; displayName: string; avatarUrl: string }
	>();

	tasks.forEach((task) => {
		if (!task.members || task.members.length === 0) {
			// Unassigned tasks
			const key = 'unassigned';
			if (!assigneeMap.has(key)) {
				assigneeMap.set(key, {
					tasks: [],
					displayName: 'Unassigned',
					avatarUrl: ''
				});
			}
			assigneeMap.get(key)?.tasks.push(task);
		} else {
			// Tasks with assignees - count for each assignee
			task.members.forEach((member) => {
				const key = member.id || 'unassigned';
				if (!assigneeMap.has(key)) {
					assigneeMap.set(key, {
						tasks: [],
						displayName:
							member.fullName ||
							(member as any).displayName ||
							'Unknown',
						avatarUrl: (member as any).avatar || ''
					});
				}
				assigneeMap.get(key)?.tasks.push(task);
			});
		}
	});

	// Transform to IWorkItemInsightRow[]
	const result: IWorkItemInsightRow[] = [];

	assigneeMap.forEach((data, assigneeId) => {
		const counts = {
			cancelled: 0,
			completed: 0,
			backlog: 0,
			unstarted: 0,
			started: 0
		};

		data.tasks.forEach((task) => {
			const group = getStateGroup(task);
			switch (group) {
				case 'completed':
					counts.completed++;
					break;
				case 'started':
					counts.started++;
					break;
				case 'backlog':
					counts.backlog++;
					break;
				case 'cancelled':
					counts.cancelled++;
					break;
				case 'unstarted':
				default:
					counts.unstarted++;
					break;
			}
		});

		result.push({
			display_name: data.displayName,
			assignee_id: assigneeId === 'unassigned' ? null : assigneeId,
			avatar_url: data.avatarUrl || null,
			cancelled_work_items: counts.cancelled,
			completed_work_items: counts.completed,
			backlog_work_items: counts.backlog,
			un_started_work_items: counts.unstarted,
			started_work_items: counts.started
		});
	});

	return result.sort((a, b) =>
		(a.display_name || '').localeCompare(b.display_name || '')
	);
}

/**
 * X-Axis field mapping (Plane property -> Gauzy task field)
 */
const xAxisFieldMapping: Record<
	ChartXAxisProperty,
	{ key: string; name: string }
> = {
	[ChartXAxisProperty.PRIORITY]: { key: 'priority', name: 'priority' },
	[ChartXAxisProperty.STATES]: { key: 'taskStatusId', name: 'status' },
	[ChartXAxisProperty.STATE_GROUPS]: { key: 'status', name: 'status' },
	[ChartXAxisProperty.ASSIGNEES]: { key: 'members', name: 'members' },
	[ChartXAxisProperty.LABELS]: { key: 'tags', name: 'tags' },
	[ChartXAxisProperty.CYCLES]: {
		key: 'organizationSprintId',
		name: 'organizationSprint'
	},
	[ChartXAxisProperty.MODULES]: { key: 'modules', name: 'modules' },
	[ChartXAxisProperty.CREATED_AT]: { key: 'createdAt', name: 'createdAt' },
	[ChartXAxisProperty.COMPLETED_AT]: {
		key: 'resolvedAt',
		name: 'resolvedAt'
	},
	[ChartXAxisProperty.CREATED_BY]: {
		key: 'createdByUserId',
		name: 'createdByUserId'
	},
	[ChartXAxisProperty.START_DATE]: { key: 'startDate', name: 'startDate' },
	[ChartXAxisProperty.TARGET_DATE]: { key: 'dueDate', name: 'dueDate' },
	[ChartXAxisProperty.ESTIMATE_POINTS]: {
		key: 'estimate',
		name: 'estimate'
	},
	[ChartXAxisProperty.WORK_ITEM_TYPES]: {
		key: 'issueType',
		name: 'issueType'
	},
	[ChartXAxisProperty.PROJECTS]: { key: 'projectId', name: 'project' },
	[ChartXAxisProperty.EPICS]: { key: 'parentId', name: 'parent' }
};

/**
 * Get a task's value for a given x-axis property
 */
function getTaskXAxisValue(
	task: ITask,
	xAxis: ChartXAxisProperty
): { key: string; name: string }[] {
	const fieldInfo = xAxisFieldMapping[xAxis];
	if (!fieldInfo) return [{ key: 'none', name: 'None' }];

	const value = (task as any)[fieldInfo.key];

	// Handle null/undefined
	if (value === null || value === undefined) {
		return [{ key: 'none', name: 'None' }];
	}

	// Handle arrays (members, tags, modules)
	if (Array.isArray(value)) {
		if (value.length === 0) {
			return [{ key: 'none', name: 'None' }];
		}
		return value.map((item) => ({
			key: item.id || String(item),
			name: item.name || item.fullName || item.title || String(item)
		}));
	}

	// Handle dates
	if (xAxis === ChartXAxisProperty.CREATED_AT || 
		xAxis === ChartXAxisProperty.COMPLETED_AT ||
		xAxis === ChartXAxisProperty.START_DATE ||
		xAxis === ChartXAxisProperty.TARGET_DATE) {
		const date = new Date(value);
		const dateStr = date.toISOString().split('T')[0];
		return [{ key: dateStr, name: dateStr }];
	}

	// Handle priority
	if (xAxis === ChartXAxisProperty.PRIORITY) {
		const priority = value || 'none';
		return [{ key: priority, name: priority }];
	}

	// Handle state groups
	if (xAxis === ChartXAxisProperty.STATE_GROUPS) {
		const group = getStateGroup(task);
		return [{ key: group, name: group }];
	}

	// Default: use value as string
	return [{ key: String(value), name: String(value) }];
}

/**
 * Build chart data from tasks based on x_axis and optional group_by
 */
export function buildChartData(
	tasks: ITask[],
	xAxis: ChartXAxisProperty,
	groupBy?: ChartXAxisProperty
): IAdvanceAnalyticsChartResponse {
	const dataMap = new Map<
		string,
		{ name: string; count: number; groups: Map<string, number> }
	>();
	const schemaSet = new Map<string, string>();

	tasks.forEach((task) => {
		const xValues = getTaskXAxisValue(task, xAxis);

		xValues.forEach(({ key, name }) => {
			if (!dataMap.has(key)) {
				dataMap.set(key, { name, count: 0, groups: new Map() });
			}
			const entry = dataMap.get(key)!;
			entry.count++;

			// Handle group_by if specified
			if (groupBy) {
				const groupValues = getTaskXAxisValue(task, groupBy);
				groupValues.forEach((gv) => {
					const groupCount = entry.groups.get(gv.key) || 0;
					entry.groups.set(gv.key, groupCount + 1);
					schemaSet.set(gv.key, gv.name);
				});
			}
		});
	});

	// Convert to array of chart data items
	const data: IChartDataItem[] = [];
	dataMap.forEach((entry, key) => {
		const item: IChartDataItem = {
			key,
			name: entry.name,
			count: entry.count
		};

		// Add group counts
		entry.groups.forEach((count, groupKey) => {
			item[groupKey] = count;
		});

		data.push(item);
	});

	// Sort by count descending
	data.sort((a, b) => b.count - a.count);

	// Build schema
	const schema: Record<string, string> = {};
	schemaSet.forEach((name, key) => {
		schema[key] = name;
	});

	return { data, schema };
}

/**
 * Build work item completion chart (created vs completed over time)
 */
export function buildWorkItemCompletionChart(
	tasks: ITask[],
	startDate: Date,
	endDate: Date,
	granularity: 'day' | 'month' = 'month'
): IAdvanceAnalyticsChartResponse {
	const dataMap = new Map<
		string,
		{ createdCount: number; completedCount: number }
	>();

	// Initialize date range
	const current = new Date(startDate);
	while (current <= endDate) {
		const key = formatDateKey(current, granularity);
		dataMap.set(key, { createdCount: 0, completedCount: 0 });

		if (granularity === 'day') {
			current.setDate(current.getDate() + 1);
		} else {
			current.setMonth(current.getMonth() + 1);
		}
	}

	// Count tasks by creation and completion date
	tasks.forEach((task) => {
		if (task.createdAt) {
			const key = formatDateKey(new Date(task.createdAt), granularity);
			if (dataMap.has(key)) {
				dataMap.get(key)!.createdCount++;
			}
		}
		if (task.resolvedAt) {
			const key = formatDateKey(new Date(task.resolvedAt), granularity);
			if (dataMap.has(key)) {
				dataMap.get(key)!.completedCount++;
			}
		}
	});

	// Convert to chart data
	const data: IChartDataItem[] = [];
	dataMap.forEach((counts, key) => {
		data.push({
			key,
			name: key,
			count: counts.createdCount + counts.completedCount,
			created_issues: counts.createdCount,
			completed_issues: counts.completedCount
		});
	});

	return {
		data,
		schema: {
			completed_issues: 'completed_issues',
			created_issues: 'created_issues'
		}
	};
}

/**
 * Format date to key string based on granularity
 */
function formatDateKey(date: Date, granularity: 'day' | 'month'): string {
	const year = date.getFullYear();
	const month = String(date.getMonth() + 1).padStart(2, '0');
	const day = String(date.getDate()).padStart(2, '0');

	if (granularity === 'day') {
		return `${year}-${month}-${day}`;
	}
	return `${year}-${month}-01`;
}
