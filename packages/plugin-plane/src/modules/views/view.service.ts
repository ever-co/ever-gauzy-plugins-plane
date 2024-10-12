import { BadRequestException, Injectable } from '@nestjs/common';
import { ICreateViewInput, ID, ITaskView, IView } from '@plane-plugin/models';
import { createViewInputTransformer, issueViewTransformer } from '../../config';
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
}
