import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Post
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ID } from '@ever-gauzy/plugin-integration-plane-models';
import { StatesService } from './states.service';
import { CreateStateDto } from './dto';

@ApiTags('States routes')
@Controller()
export class StatesController {
	constructor(private readonly _stateService: StatesService) {}

	/**
	 * @description - Get all project states
	 * @returns - A promise that resolves after getting all project states
	 * @memberof WorkspaceController
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get project states' })
	@Get()
	async getWorkspaceProjectStates(@Param('projectId') projectId: ID) {
		return await this._stateService.getWorkspaceProjectStates(projectId);
	}

	/**
	 * @description - Create project state
	 * @param {ICreateStateInput} input
	 * @returns - A promise that resolves after state created
	 * @memberof StatesController
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create project state' })
	@Post()
	async create(
		@Param('projectId') project_id: ID,
		@Body() input: CreateStateDto
	) {
		return await this._stateService.create({
			...input,
			project_id
		});
	}

	/**
	 * @description - Delete project state
	 * @param {ID} id - the of the state to be deleted
	 * @returns - A promise that resolves after state deleted
	 * @memberof StatesController
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete state' })
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return await this._stateService.delete(id);
	}
}
