import { BadRequestException, Injectable } from '@nestjs/common';
import { ICreateStateInput, IState, ITaskStatus } from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	createStateInputTransformer,
	getStatesTransformer,
} from '../../config';

@Injectable()
export class StatesService {
	constructor(private readonly _serverFetchService: ApiFetchService) {}

	/**
	 * @description - Create state
	 * @param {ICreateStateInput} payload
	 * @returns - A promise that resolves after state created
	 * @memberof StatesService
	 */
	async createState(payload: ICreateStateInput): Promise<IState> {
		const body = createStateInputTransformer(payload);
		console.log(body);
		try {
			const state: ITaskStatus = (
				await this._serverFetchService.apiFetch({
					method: 'POST',
					path: '/task-statuses',
					body,
				})
			).data;

			console.log(state);

			return getStatesTransformer([state])[0] as IState;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
