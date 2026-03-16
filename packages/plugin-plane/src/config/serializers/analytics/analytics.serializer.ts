import {
	ChartXAxisProperty,
	IAdvanceAnalyticsChartResponse,
	IAdvanceAnalyticsResponse,
	IChartDataItem,
	ITask,
	IWorkItemInsightRow,
	TaskStatusEnum
} from '@ever-gauzy/plugin-integration-plane-models';
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
 * Get a task's value for a given x-axis property
 */
function getTaskXAxisValue(
	task: ITask,
	xAxis: ChartXAxisProperty
): { key: string; name: string }[] {
	// Handle STATE_GROUPS first - uses computed state group, not a direct field
	if (xAxis === ChartXAxisProperty.STATE_GROUPS) {
		const group = getStateGroup(task);
		return [{ key: group, name: group }];
	}

	// Handle ASSIGNEES - need proper format with employee ID as key
	if (xAxis === ChartXAxisProperty.ASSIGNEES) {
		const members = task.members;
		if (!members || members.length === 0) {
			return [{ key: 'None', name: 'None' }];
		}
		return members.map((member) => {
			// Try to get display name from various sources
			let displayName = 'None';
			
			// 1. Check employee.fullName
			if (member.fullName) {
				displayName = member.fullName;
			}
			// 2. Check employee.user.firstName + lastName
			else if (member.user?.firstName || member.user?.lastName) {
				displayName = [member.user.firstName, member.user.lastName]
					.filter(Boolean)
					.join(' ');
			}
			// 3. Check employee.user.fullName
			else if (member.user?.fullName) {
				displayName = member.user.fullName;
			}
			// 4. Check employee.user.email
			else if (member.user?.email) {
				displayName = member.user.email;
			}
			
			return {
				key: member.id || 'None',
				name: displayName
			};
		});
	}

	// Handle STATES - use taskStatus
	if (xAxis === ChartXAxisProperty.STATES) {
		const statusId = task.taskStatusId || task.taskStatus?.id;
		const statusName = task.taskStatus?.name || task.status || 'None';
		if (!statusId) {
			return [{ key: 'None', name: 'None' }];
		}
		return [{ key: statusId, name: statusName }];
	}

	// Handle LABELS
	if (xAxis === ChartXAxisProperty.LABELS) {
		const tags = task.tags;
		if (!tags || tags.length === 0) {
			return [{ key: 'None', name: 'None' }];
		}
		return tags.map((tag) => ({
			key: tag.id || 'None',
			name: tag.name || 'None'
		}));
	}

	// Handle MODULES
	if (xAxis === ChartXAxisProperty.MODULES) {
		const modules = task.modules;
		if (!modules || modules.length === 0) {
			return [{ key: 'None', name: 'None' }];
		}
		return modules.map((mod) => ({
			key: mod.id || 'None',
			name: mod.name || 'None'
		}));
	}

	// Handle CYCLES
	if (xAxis === ChartXAxisProperty.CYCLES) {
		const sprintId = task.organizationSprintId;
		const sprintName = (task as ITask).organizationSprint?.name;
		if (!sprintId) {
			return [{ key: 'None', name: 'None' }];
		}
		return [{ key: sprintId, name: sprintName || sprintId }];
	}

	// Handle PRIORITY
	if (xAxis === ChartXAxisProperty.PRIORITY) {
		const priority = task.priority || 'none';
		return [{ key: priority, name: priority }];
	}

	// Handle dates
	if (xAxis === ChartXAxisProperty.CREATED_AT) {
		if (!task.createdAt) return [{ key: 'None', name: 'None' }];
		const dateStr = new Date(task.createdAt).toISOString().split('T')[0];
		return [{ key: dateStr, name: dateStr }];
	}
	if (xAxis === ChartXAxisProperty.COMPLETED_AT) {
		if (!task.resolvedAt) return [{ key: 'None', name: 'None' }];
		const dateStr = new Date(task.resolvedAt).toISOString().split('T')[0];
		return [{ key: dateStr, name: dateStr }];
	}
	if (xAxis === ChartXAxisProperty.START_DATE) {
		if (!task.startDate) return [{ key: 'None', name: 'None' }];
		const dateStr = new Date(task.startDate).toISOString().split('T')[0];
		return [{ key: dateStr, name: dateStr }];
	}
	if (xAxis === ChartXAxisProperty.TARGET_DATE) {
		if (!task.dueDate) return [{ key: 'None', name: 'None' }];
		const dateStr = new Date(task.dueDate).toISOString().split('T')[0];
		return [{ key: dateStr, name: dateStr }];
	}

	// Handle CREATED_BY
	if (xAxis === ChartXAxisProperty.CREATED_BY) {
		const creatorId = task.createdByUserId;
		if (!creatorId) return [{ key: 'None', name: 'None' }];
		// We don't have creator name in task, use ID
		return [{ key: creatorId, name: creatorId }];
	}

	// Default fallback for unknown x_axis
	return [{ key: 'None', name: 'None' }];
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
