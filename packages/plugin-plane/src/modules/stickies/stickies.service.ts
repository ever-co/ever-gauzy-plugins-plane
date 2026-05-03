import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ID,
	IPagination,
	ISticky,
	IStickyCreateInput,
	IStickyUpdateInput,
	ITask
} from '@ever-gauzy/plugin-integration-plane-models';
import {
	stickyTransformer,
	stickyCreateInputTransformer,
	stickyUpdateInputTransformer
} from '../../config';
import { baseGetItemsWhereQuery } from '../../config/serializers/query-params.serializers';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class StickiesService extends ApiFetchService {
	constructor(
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}

	private readonly path = '/tasks';

	/**
	 * @description Build the query to fetch only memo tasks (stickies) without a project.
	 */
	private getStickyQuery(): Record<string, string> {
		return {
			...baseGetItemsWhereQuery(),
			'where[issueType]': 'memo'
		};
	}

	/**
	 * @description List all stickies for the current workspace user.
	 * @param {string} [searchQuery] - Optional text search query
	 * @returns Paginated stickies list
	 */
	async findAll(searchQuery?: string): Promise<{
		results: ISticky[];
		total_results: number;
		next_page_results: boolean;
		prev_page_results: boolean;
	}> {
		try {
			const query = qs.stringify(this.getStickyQuery());

			const response: IPagination<ITask> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query
				})
			).data;

			let stickies = stickyTransformer(response.items ?? []);

			// Apply text search if provided (matching Django's description_stripped__icontains)
			if (searchQuery) {
				const q = searchQuery.toLowerCase();
				stickies = stickies.filter(
					(s) =>
						s.description_stripped?.toLowerCase().includes(q) ||
						s.name?.toLowerCase().includes(q)
				);
			}

			// Sort by sort_order descending (matching Django's order_by("-sort_order"))
			stickies.sort((a, b) => (b.sort_order ?? 0) - (a.sort_order ?? 0));

			return {
				results: stickies,
				total_results: stickies.length,
				next_page_results: false,
				prev_page_results: false
			};
		} catch (error: any) {
			this.logger.error(
				'Failed to list stickies',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * @description Get a single sticky by ID.
	 * @param {ID} id - Sticky (task) ID
	 * @returns Sticky detail
	 */
	async findOne(id: ID): Promise<ISticky> {
		try {
			const task: ITask = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/${id}`,
					query: qs.stringify(this.getStickyQuery())
				})
			).data;

			return stickyTransformer(task);
		} catch (error: any) {
			this.logger.error(
				'Failed to get sticky',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * @description Create a new sticky (task with issueType='memo', no project).
	 * @param {IStickyCreateInput} input - Sticky data
	 * @returns The created sticky
	 */
	async create(input: IStickyCreateInput): Promise<ISticky> {
		try {
			const body = stickyCreateInputTransformer(input);

			const task: ITask = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body
				})
			).data;

			return stickyTransformer(task);
		} catch (error: any) {
			this.logger.error(
				'Failed to create sticky',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}

	/**
	 * @description Update an existing sticky.
	 * @param {ID} id - Sticky (task) ID
	 * @param {IStickyUpdateInput} input - Partial update data
	 * @returns The updated sticky
	 */
	async update(id: ID, input: IStickyUpdateInput): Promise<ISticky> {
		try {
			// Fetch existing task to get the current description meta
			const existingTask: ITask = (
				await this.apiFetch({
					method: 'GET',
					path: `${this.path}/${id}`,
					query: qs.stringify(this.getStickyQuery())
				})
			).data;

			if (!existingTask) {
				throw new BadRequestException(`Sticky ${id} not found`);
			}

			const body = stickyUpdateInputTransformer(input, existingTask.description);

			const updatedTask: ITask = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body
				})
			).data;

			return stickyTransformer(updatedTask);
		} catch (error: any) {
			this.logger.error(
				'Failed to update sticky',
				error instanceof Error ? error.stack : String(error)
			);
			if (error instanceof BadRequestException) throw error;
			this.handleApiError(error);
		}
	}

	/**
	 * @description Delete a sticky.
	 * @param {ID} id - Sticky (task) ID
	 * @returns Delete result
	 */
	async delete(id: ID): Promise<any> {
		try {
			return (
				await this.apiFetch({
					method: 'DELETE',
					path: `${this.path}/${id}/soft`
				})
			).data;
		} catch (error: any) {
			this.logger.error(
				'Failed to delete sticky',
				error instanceof Error ? error.stack : String(error)
			);
			this.handleApiError(error);
		}
	}
}
