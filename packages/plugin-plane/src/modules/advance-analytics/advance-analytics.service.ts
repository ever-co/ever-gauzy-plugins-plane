import { BadRequestException, forwardRef, Inject, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	AnalyticsType,
	ChartXAxisProperty,
	IAdvanceAnalyticsChartResponse,
	IAdvanceAnalyticsResponse,
	ID,
	IPagination,
	ITask,
	IWorkItemInsightRow
} from '@plane-plugin/models';
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

	/**
	 * Get tasks from external API with optional filters
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
				getTaskQuery(projectId, options, ['members.user', 'tags', 'taskStatus', 'organizationSprint', 'modules'], null, false)
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

	/**
	 * Get advance analytics stats (total/started/backlog/unstarted/completed counts)
	 * Endpoint: GET /:projectId/advance-analytics
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
	 * Endpoint: GET /:projectId/advance-analytics-stats/
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
	 * Endpoint: GET /:projectId/advance-analytics-charts/
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
}
