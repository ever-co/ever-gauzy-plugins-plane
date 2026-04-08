import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	AnalyticsType,
	ChartXAxisProperty,
	IAdvanceAnalyticsChartResponse,
	IAdvanceAnalyticsResponse,
	IChartDataItem,
	ID,
	IPagination,
	ITask,
	IWorkItemInsightRow
} from '@ever-gauzy/plugin-integration-plane-models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import { ProjectService } from '../project/project.service';
import {
	AdvanceAnalyticsChartsQueryDto,
	AdvanceAnalyticsQueryDto,
	AdvanceAnalyticsStatsQueryDto
} from './dto';
import {
	buildChartData,
	buildWorkItemCompletionChart,
	getStateGroup,
	transformToAdvanceAnalytics,
	transformToWorkItemStats
} from '../../config/serializers/analytics';
import { getTaskQuery } from '../../config';

@Injectable()
export class AdvanceAnalyticsService extends ApiFetchService {
	constructor(
		@Inject(forwardRef(() => ProjectService))
		private readonly _projectService: ProjectService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/tasks';

	/*
	|--------------------------------------------------------------------------
	| PRIVATE: Task fetching helpers
	|--------------------------------------------------------------------------
	*/

	/**
	 * Get ALL tasks from external API (workspace-level, no project filter)
	 */
	private async getAllTasks(): Promise<ITask[]> {
		try {
			const query = qs.stringify(
				getTaskQuery(undefined, {}, ['members.user', 'tags', 'taskStatus', 'organizationSprint', 'modules'], undefined, false)
			);

			const tasks: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;

			return tasks.items || [];
		} catch (error: any) {
			this.logger.error(
				`Failed to fetch all tasks: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Get tasks from external API with optional project/cycle/module filters
	 */
	private async getTasks(
		projectId: ID,
		cycleId?: ID,
		moduleId?: ID
	): Promise<ITask[]> {
		try {
			const options: Record<string, any> = {
				projectId
			};

			if (cycleId) {
				options.cycle = cycleId;
			}

			if (moduleId) {
				options.module = moduleId;
			}

			const query = qs.stringify(
				getTaskQuery(projectId, options, ['members.user', 'tags', 'taskStatus', 'organizationSprint', 'modules'], undefined, false)
			);

			const tasks: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;

			return tasks.items || [];
		} catch (error: any) {
			this.logger.error(
				`Failed to fetch tasks: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/*
	|--------------------------------------------------------------------------
	| PROJECT-LEVEL analytics (with projectId)
	|--------------------------------------------------------------------------
	*/

	/**
	 * Get advance analytics stats (total/started/backlog/unstarted/completed counts)
	 * Endpoint: GET /projects/:projectId/advance-analytics
	 */
	async getAdvanceAnalytics(
		projectId: ID,
		query: AdvanceAnalyticsQueryDto
	): Promise<IAdvanceAnalyticsResponse> {
		try {
			const tasks = await this.getTasks(
				projectId,
				query.cycle_id,
				query.module_id
			);

			return transformToAdvanceAnalytics(tasks);
		} catch (error: any) {
			this.logger.error(
				`Failed to get advance analytics: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Get advance analytics stats per assignee (for table view)
	 * Endpoint: GET /projects/:projectId/advance-analytics-stats/
	 */
	async getAdvanceAnalyticsStats(
		projectId: ID,
		query: AdvanceAnalyticsStatsQueryDto
	): Promise<IWorkItemInsightRow[]> {
		try {
			if (query.type !== AnalyticsType.WORK_ITEMS) {
				throw new BadRequestException('Invalid type. Expected: work-items');
			}

			const tasks = await this.getTasks(
				projectId,
				query.cycle_id,
				query.module_id
			);

			return transformToWorkItemStats(tasks);
		} catch (error: any) {
			this.logger.error(
				`Failed to get advance analytics stats: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Get advance analytics charts data
	 * Endpoint: GET /projects/:projectId/advance-analytics-charts/
	 */
	async getAdvanceAnalyticsCharts(
		projectId: ID,
		query: AdvanceAnalyticsChartsQueryDto
	): Promise<IAdvanceAnalyticsChartResponse> {
		try {
			const tasks = await this.getTasks(
				projectId,
				query.cycle_id,
				query.module_id
			);

			if (query.type === AnalyticsType.CUSTOM_WORK_ITEMS) {
				// Custom chart with x_axis/y_axis/group_by
				const xAxis = query.x_axis || ChartXAxisProperty.PRIORITY;
				const groupBy = query.group_by;

				return buildChartData(tasks, xAxis, groupBy);
			} else if (query.type === AnalyticsType.WORK_ITEMS) {
				// Work item completion chart (created vs completed over time)
				const project = await this._projectService.getExternalProject(projectId);

				let startDate: Date;
				if (project?.createdAt) {
					startDate = new Date(project.createdAt);
					startDate.setDate(1); // First of the month
				} else {
					// Default to 6 months ago
					startDate = new Date();
					startDate.setMonth(startDate.getMonth() - 6);
					startDate.setDate(1);
				}

				const endDate = new Date();

				// Determine granularity based on cycle/module
				const granularity =
					query.cycle_id || query.module_id ? 'day' : 'month';

				return buildWorkItemCompletionChart(
					tasks,
					startDate,
					endDate,
					granularity
				);
			}

			// Default: projects type - return chart grouped by priority
			return buildChartData(tasks, ChartXAxisProperty.PRIORITY);
		} catch (error: any) {
			this.logger.error(
				`Failed to get advance analytics charts: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/*
	|--------------------------------------------------------------------------
	| WORKSPACE-LEVEL analytics (no projectId)
	|--------------------------------------------------------------------------
	*/

	/**
	 * Get workspace-level advance analytics.
	 *
	 * Matches Plane's AdvanceAnalyticsEndpoint.get() which dispatches by tab:
	 *
	 * - tab=overview → { total_users, total_admins, total_members, total_guests,
	 *                    total_projects, total_work_items, total_cycles, total_intake }
	 *                   Each field is { count: number }.
	 *
	 * - tab=work-items → { total_work_items, started_work_items, backlog_work_items,
	 *                      un_started_work_items, completed_work_items }
	 *                     Each field is { count: number }.
	 */
	async getWorkspaceAdvanceAnalytics(
		tab: string | undefined,
		query: AdvanceAnalyticsQueryDto
	): Promise<any> {
		try {
			const resolvedTab = tab || 'overview';

			if (resolvedTab === 'overview') {
				return this.getOverviewData();
			} else if (resolvedTab === 'work-items') {
				const tasks = await this.getAllTasks();
				return transformToAdvanceAnalytics(tasks);
			}

			throw new BadRequestException('Invalid tab');
		} catch (error: any) {
			this.logger.error(
				`Failed to get workspace advance analytics: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Get workspace-level advance analytics charts data.
	 *
	 * Matches Plane's AdvanceAnalyticsChartEndpoint.get() which dispatches by type:
	 *
	 * - type=projects → Returns a flat array [{key, name, count}]
	 *   (work_items, cycles, modules, intake, members, pages, views)
	 *
	 * - type=work-items → Returns {data, schema} with created vs completed over time
	 *
	 * - type=custom-work-items → Returns {data, schema} with x_axis/group_by charting
	 */
	async getWorkspaceAdvanceAnalyticsCharts(
		query: AdvanceAnalyticsChartsQueryDto
	): Promise<any> {
		try {
			if (query.type === AnalyticsType.PROJECTS || !query.type) {
				return this.getProjectChart();
			}

			const tasks = await this.getAllTasks();

			if (query.type === AnalyticsType.CUSTOM_WORK_ITEMS) {
				const xAxis = query.x_axis || ChartXAxisProperty.PRIORITY;
				const groupBy = query.group_by;
				return buildChartData(tasks, xAxis, groupBy);
			} else if (query.type === AnalyticsType.WORK_ITEMS) {
				// Work item completion chart (created vs completed over time)
				const startDate = new Date();
				startDate.setMonth(startDate.getMonth() - 6);
				startDate.setDate(1);

				const endDate = new Date();

				return buildWorkItemCompletionChart(
					tasks,
					startDate,
					endDate,
					'month'
				);
			}

			throw new BadRequestException('Invalid type');
		} catch (error: any) {
			this.logger.error(
				`Failed to get workspace advance analytics charts: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/**
	 * Get workspace-level advance analytics stats (table view).
	 *
	 * Matches Plane's AdvanceAnalyticsStatsEndpoint.get_work_items_stats():
	 * returns per-project work item counts grouped by state group.
	 * [{project_id, project__name, cancelled_work_items, completed_work_items,
	 *   backlog_work_items, un_started_work_items, started_work_items}]
	 */
	async getWorkspaceAdvanceAnalyticsStats(
		query: AdvanceAnalyticsStatsQueryDto
	): Promise<IWorkItemInsightRow[]> {
		try {
			if (query.type !== AnalyticsType.WORK_ITEMS) {
				throw new BadRequestException('Invalid type. Expected: work-items');
			}

			const tasks = await this.getAllTasks();

			// Group tasks by projectId and compute per-project counts
			const projectMap = new Map<
				string,
				{ name: string; tasks: ITask[] }
			>();

			for (const task of tasks) {
				const projectId = task.projectId || 'none';
				if (!projectMap.has(projectId)) {
					projectMap.set(projectId, { name: projectId, tasks: [] });
				}
				projectMap.get(projectId)!.tasks.push(task);
			}

			// Fetch project names
			const projects = await this._projectService.getExternalProjects([]);
			const projectNameMap = new Map<string, string>();
			for (const project of projects) {
				if (project.id) {
					projectNameMap.set(project.id, project.name || project.id);
				}
			}

			const result: IWorkItemInsightRow[] = [];

			projectMap.forEach((data, projectId) => {
				const counts = {
					cancelled: 0,
					completed: 0,
					backlog: 0,
					unstarted: 0,
					started: 0
				};

				for (const task of data.tasks) {
					const group = getStateGroup(task);
					switch (group) {
						case 'completed': counts.completed++; break;
						case 'started': counts.started++; break;
						case 'backlog': counts.backlog++; break;
						case 'cancelled': counts.cancelled++; break;
						default: counts.unstarted++; break;
					}
				}

				result.push({
					project_id: projectId,
					project__name: projectNameMap.get(projectId) || projectId,
					cancelled_work_items: counts.cancelled,
					completed_work_items: counts.completed,
					backlog_work_items: counts.backlog,
					un_started_work_items: counts.unstarted,
					started_work_items: counts.started
				});
			});

			return result.sort((a, b) =>
				(a.project__name || '').localeCompare(b.project__name || '')
			);
		} catch (error: any) {
			this.logger.error(
				`Failed to get workspace advance analytics stats: ${error?.response?.data?.message || error.message}`,
				error.stack
			);
			throw new BadRequestException(error);
		}
	}

	/*
	|--------------------------------------------------------------------------
	| PRIVATE: Workspace overview data builders
	|--------------------------------------------------------------------------
	*/

	/**
	 * Build overview data matching Plane's AdvanceAnalyticsEndpoint.get_overview_data().
	 *
	 * Returns counts for: total_users, total_admins, total_members, total_guests,
	 * total_projects, total_work_items, total_cycles, total_intake.
	 * Each field is { count: number }.
	 */
	private async getOverviewData(): Promise<Record<string, { count: number }>> {
		const [projects, tasks, members] = await Promise.all([
			this._projectService.getExternalProjects([
				'members',
				'organizationSprints'
			]),
			this.getAllTasks(),
			this._projectService.getExternalProjects(['members.employee.user.role']).then(
				(projs) => {
					// Collect unique member IDs across all projects
					const memberSet = new Set<string>();
					projs.forEach((p) => {
						p.members?.forEach((m) => {
							if (typeof m !== 'string' && m.employeeId) {
								memberSet.add(m.employeeId);
							}
						});
					});
					return memberSet.size;
				}
			)
		]);

		// Count total cycles across all projects
		const totalCycles = projects.reduce(
			(sum, p) => sum + (p.organizationSprints?.length || 0),
			0
		);

		return {
			total_users: { count: members },
			total_admins: { count: 0 },
			total_members: { count: members },
			total_guests: { count: 0 },
			total_projects: { count: projects.length },
			total_work_items: { count: tasks.length },
			total_cycles: { count: totalCycles },
			total_intake: { count: 0 }
		};
	}

	/**
	 * Build project chart matching Plane's AdvanceAnalyticsChartEndpoint.project_chart().
	 *
	 * Returns a flat array (NOT wrapped in {data, schema}) of:
	 * [{key, name, count}] for work_items, cycles, modules, intake, members, pages, views.
	 */
	private async getProjectChart(): Promise<IChartDataItem[]> {
		const projects = await this._projectService.getExternalProjects([
			'members',
			'organizationSprints',
			'modules'
		]);

		const tasks = await this.getAllTasks();

		// Count unique members across all projects
		const memberSet = new Set<string>();
		projects.forEach((p) => {
			p.members?.forEach((m) => {
				if (typeof m !== 'string' && m.employeeId) {
					memberSet.add(m.employeeId);
				}
			});
		});

		const totalCycles = projects.reduce(
			(sum, p) => sum + (p.organizationSprints?.length || 0),
			0
		);
		const totalModules = projects.reduce(
			(sum, p) => sum + (p.modules?.length || 0),
			0
		);

		const data: Record<string, number> = {
			work_items: tasks.length,
			cycles: totalCycles,
			modules: totalModules,
			intake: 0,
			members: memberSet.size,
			pages: 0,
			views: 0
		};

		return Object.entries(data).map(([key, value]) => ({
			key,
			name: key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
			count: value || 0
		}));
	}
}
