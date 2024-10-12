import { BadRequestException, Injectable } from '@nestjs/common';
import {
	ICreateViewInput,
	ID,
	ITaskView,
	IUpdateViewInput,
	IView,
} from '@plane-plugin/models';
import {
	createViewInputTransformer,
	issueViewTransformer,
	updateViewInputTransformer,
} from '../../config';
import { ApiFetchService } from '../api-fetch/api-fetch.service';

@Injectable()
export class IssueViewService extends ApiFetchService {
	private readonly path = '/task-views';

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
			const body = { ...createViewInputTransformer(input, projectId) };

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
			const body = { ...updateViewInputTransformer(input, projectId) };

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
