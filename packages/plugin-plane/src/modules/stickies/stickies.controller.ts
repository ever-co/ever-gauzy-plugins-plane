import { ApiOperation, ApiTags } from '@nestjs/swagger';
import {
	Body,
	Controller,
	Delete,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
	Post,
	Query
} from '@nestjs/common';
import {
	ID,
	IStickyCreateInput,
	IStickyUpdateInput
} from '@ever-gauzy/plugin-integration-plane-models';
import { StickiesService } from './stickies.service';

@ApiTags('Stickies')
@Controller()
export class StickiesController {
	constructor(private readonly _stickiesService: StickiesService) {}

	/**
	 * @description List all stickies for the current workspace
	 * @param {string} query - Optional search text
	 * @returns Paginated list of stickies
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'List Stickies' })
	@Get()
	async findAll(@Query('query') query?: string) {
		return this._stickiesService.findAll(query);
	}

	/**
	 * @description Create a new sticky
	 * @param {IStickyCreateInput} input - Sticky data
	 * @returns The created sticky
	 */
	@HttpCode(HttpStatus.CREATED)
	@ApiOperation({ summary: 'Create Sticky' })
	@Post()
	async create(@Body() input: IStickyCreateInput) {
		return this._stickiesService.create(input);
	}

	/**
	 * @description Get a single sticky
	 * @param {ID} id - Sticky ID
	 * @returns Sticky detail
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Sticky' })
	@Get(':id')
	async findOne(@Param('id') id: ID) {
		return this._stickiesService.findOne(id);
	}

	/**
	 * @description Update a sticky (partial update)
	 * @param {ID} id - Sticky ID
	 * @param {IStickyUpdateInput} input - Partial update data
	 * @returns The updated sticky
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update Sticky' })
	@Patch(':id')
	async update(@Param('id') id: ID, @Body() input: IStickyUpdateInput) {
		return this._stickiesService.update(id, input);
	}

	/**
	 * @description Delete a sticky
	 * @param {ID} id - Sticky ID
	 */
	@HttpCode(HttpStatus.NO_CONTENT)
	@ApiOperation({ summary: 'Delete Sticky' })
	@Delete(':id')
	async delete(@Param('id') id: ID) {
		return this._stickiesService.delete(id);
	}
}
