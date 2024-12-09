import { BadRequestException, Injectable } from '@nestjs/common';
import {
	IIntakeIssue,
	IIntakeIssueCreateInput,
	IScreeningTask,
	IState,
	TaskStatusEnum
} from '@plane-plugin/models';
import { ApiFetchService } from '../../api-fetch/api-fetch.service';
import { StatesService } from '../../states/states.service';
import {
	createIntakeIssueInputTransformer,
	intakeIssueTranformer
} from '../../../config';

@Injectable()
export class IntakeIssuesService extends ApiFetchService {
	constructor(
		private readonly _stateSerive: StatesService,
		private readonly _serverFetchService: ApiFetchService
	) {
		super(_serverFetchService['_httpService']);
	}
	private readonly path = '/screening-tasks';

	async create(
		input: IIntakeIssueCreateInput
	): Promise<IIntakeIssue | IIntakeIssue[]> {
		try {
			const { state_id } = input.issue;

			// Set default status
			let state: IState = { name: TaskStatusEnum.BACKLOG };
			if (state_id && state_id.length > 0) {
				state = await this._stateSerive.getOne(state_id);
			}

			const body = createIntakeIssueInputTransformer(
				input,
				state.name as TaskStatusEnum
			);

			const screeningTask: IScreeningTask = (
				await this.apiFetch({
					method: 'POST',
					path: this.path,
					body
				})
			).data;

			return intakeIssueTranformer(screeningTask);
		} catch (error: any) {
			console.log(error);
			throw new BadRequestException(error);
		}
	}
}
