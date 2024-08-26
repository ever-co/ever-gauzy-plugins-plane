import { BadRequestException, Injectable } from '@nestjs/common';
import {
	ICreateStateInput,
	ID,
	IState,
	ITaskStatus,
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	createStateInputTransformer,
	getStatesTransformer,
} from '../../config';

@Injectable()
export class StatesService extends ApiFetchService {
	private readonly path = '/task-statuses';
	/**
	 * @description - Create state
	 * @param {ICreateStateInput} payload
	 * @returns - A promise that resolves after state created
	 * @memberof StatesService
	 */
	async create(payload: ICreateStateInput): Promise<IState> {
		const body = createStateInputTransformer(payload);
		try {
			const state: ITaskStatus = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body,
				})
			).data;

			return getStatesTransformer([state])[0] as IState;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	async delete(id: ID): Promise<any> {
		return (
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${id}`,
			})
		).data;
	}
}
