import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { StatesService } from './states.service';
import { CreateStateDto } from './dto';

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
	async createState(@Body() payload: CreateStateDto) {
		return await this._stateService.createState(payload);
	}
}
