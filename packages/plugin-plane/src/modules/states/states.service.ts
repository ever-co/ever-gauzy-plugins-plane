import {
	BadRequestException,
	Injectable,
	InternalServerErrorException,
} from '@nestjs/common';
import qs from 'qs';
import {
	ICreateStateInput,
	ID,
	IPagination,
	IState,
	ITaskStatus,
} from '@plane-plugin/models';
import { ApiFetchService } from '../api-fetch/api-fetch.service';
import {
	createStateInputTransformer,
	getStatesQuery,
	getStatesTransformer,
} from '../../config';

@Injectable()
export class StatesService extends ApiFetchService {
	private readonly path = '/task-statuses';

	/**
	 * @description - Get state by Id
	 * @param {ID} id - the state ID to be fetched
	 * @returns - A promise that resolves after fetch state
	 * @memberof StatesService
	 */
	async getOne(id: ID): Promise<IState> {
		try {
			const state: ITaskStatus = (
				await this.apiFetch({
					path: `${this.path}/${id}`,
					method: 'GET',
				})
			).data;

			return getStatesTransformer([state])[0] as IState;
		} catch (error: any) {
			throw new BadRequestException(error.response);
		}
	}

	/**
	 * @description - Create state
	 * @param {ICreateStateInput} input - data for creating new state
	 * @returns - A promise that resolves after state created
	 * @memberof StatesService
	 */
	async create(input: ICreateStateInput): Promise<IState> {
		const body = createStateInputTransformer(input);

		try {
			const state: ITaskStatus = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body,
				})
			).data;

			console.log({ state });

			return getStatesTransformer([state])[0] as IState;
		} catch (error) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}

	/**
	 * @description - Delete state
	 * @param {ID} id - The state ID to be deleted
	 * @returns a promise that resolved after state deleted
	 * @memberof StatesService
	 */
	async delete(id: ID): Promise<any> {
		return (
			await this.apiFetch({
				method: 'DELETE',
				path: `${this.path}/${id}`,
			})
		).data;
	}

	/**
	 * @description - Get all states related to project
	 * @param {ID} projectId - The UUID primary key of the project for whom to get states
	 * @returns - A promise that resolves after getting all states
	 * @memberof WorkspaceController
	 */
	async getWorkspaceProjectStates(projectId: ID): Promise<IState[]> {
		const query = qs.stringify(getStatesQuery(projectId));
		try {
			const states: IPagination<ITaskStatus> = (
				await this.apiFetch({
					method: 'GET',
					path: this.path,
					query,
				})
			).data;
			return getStatesTransformer(states.items);
		} catch (error) {
			console.log(error);
			throw new InternalServerErrorException(error);
		}
	}
}
