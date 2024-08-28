import {
	Body,
	Controller,
	Delete,
	HttpCode,
	HttpStatus,
	Param,
	Post,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatesService } from './states.service';
import { CreateStateDto } from './dto';
import { ID } from '@plane-plugin/models';

@ApiTags('States routes')
@Controller('states')
export class StatesController {
	constructor(private readonly _stateService: StatesService) {}

	/**
	 * @description - Create state
	 * @param {ICreateStateInput} payload
	 * @returns - A promise that resolves after state created
	 * @memberof StatesService
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create state' })
	@Post()
	async create(@Body() payload: CreateStateDto) {
		return await this._stateService.create(payload);
	}

	/**
	 * @description - Delete state
	 * @param {ID} id - the of the state to be deleted
	 * @returns - A promise that resolves after state created
	 * @memberof StatesService
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete state' })
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return await this._stateService.delete(id);
	}
}
