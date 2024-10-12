import { BadRequestException, Injectable } from '@nestjs/common';
import qs from 'qs';
import {
	ICreateViewInput,
	ID,
	IPagination,
	ITaskView,
	IUpdateViewInput,
	IView,
} from '@plane-plugin/models';
import {
	createViewInputTransformer,
	defaultOrganizationId,
	getViewsQuery,
	issueViewTransformer,
	updateViewInputTransformer,
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class IssueViewService extends ApiFetchService {
	private readonly path = '/task-views';

	/**
	 * @description  Find a task view from external API
	 * @param {ID} id - The Task View ID to find
	 * @param {ID} [projectId] - Optional Project ID to filter research
	 * @returns {Promise<ITaskView>} - A promise resolved to found Task View
	 * @memberof IssueViewService
	 */
	async getExternalView(id: ID, projectId?: ID): Promise<ITaskView> {
		// Build the query string once
		const query = qs.stringify(getViewsQuery(projectId));

		return await (
			await this.apiFetch({
				method: 'GET',
				path: `${this.path}/${id}`,
				query,
			})
		).data;
	}

	/**
	 * @description - Create Issue View
	 * @param {ICreateViewInput} input - Body Request data for creating issue view
	 * @param {ID} [projectId] - Optional Project ID if issue view should belong to a specific project
	 * @returns {(Promise<IView | IView[]>)} A promise resolved to created and transformed Issue View
	 * @memberof IssueViewService
	 */
	async create(
		input: ICreateViewInput,
		projectId?: ID,
	): Promise<IView | IView[]> {
		try {
			const body = {
				...createViewInputTransformer(
					input,
					projectId,
					defaultOrganizationId,
				),
			};

			const view: ITaskView = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body,
				})
			).data;

			return issueViewTransformer(view);
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Update Issue view
	 * @param {ID} id - Issue View ID to be updated
	 * @param {IUpdateViewInput} input - Body Request data for updating
	 * @param {ID} [projectId] - Optional Project ID
	 * @returns {(Promise<IView | IView[]>)} - A promise that resolved to updated and transformed Issue view
	 * @memberof IssueViewService
	 */
	async update(
		id: ID,
		input: IUpdateViewInput,
		projectId?: ID,
	): Promise<IView | IView[]> {
		try {
			const body = {
				...updateViewInputTransformer(
					input,
					projectId,
					defaultOrganizationId,
				),
			};

			const view: ITaskView = (
				await this.apiFetch({
					method: 'PUT',
					path: `${this.path}/${id}`,
					body,
				})
			).data;

			console.log({ view });

			return issueViewTransformer(view);
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Find issue views
	 * @param {ID} [projectId] - Optional Project ID for filtering by project
	 * @returns - A promise resolved to found and transformed views
	 * @memberof IssueViewService
	 */
	async findAll(projectId?: ID): Promise<IView | IView[]> {
		try {
			// Build the query string once
			const query = qs.stringify(getViewsQuery(projectId));

			// Perform the API call to fetch the views
			const views: IPagination<ITaskView> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query,
				})
			).data;

			// Return the transformed views
			return issueViewTransformer(views.items);
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Find View By ID
	 * @param {ID} [id] - View ID to find
	 * @returns {(Promise<IView | IView[]>)} A promise resolved to found and tranformed Issue View
	 * @memberof IssueViewService
	 */
	async findOne(id?: ID): Promise<IView | IView[]> {
		try {
			const view = await this.getExternalView(id);
			return issueViewTransformer(view);
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description Delete View
	 * @param {ID} id - The View ID to be deleted
	 * @returns A promise resolved to delete result
	 * @memberof IssueViewService
	 */
	async delete(id: ID): Promise<any> {
		return (
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${id}`,
			})
		).data;
	}
}
