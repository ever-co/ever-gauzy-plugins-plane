import { ApiOperation } from '@nestjs/swagger';
import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param
} from '@nestjs/common';
import { ID } from '@ever-gauzy/plugin-integration-plane-models';
import { CyclesService } from './cycles.service';

@Controller()
export class ArchivedCyclesController {
	constructor(private readonly _cyclesService: CyclesService) {}

	/**
	 * @description List all archived cycles for a project
	 * @param {ID} projectId - Project ID
	 * @returns Archived cycles list
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'List Archived Cycles' })
	@Get()
	async listArchivedCycles(@Param('projectId') projectId: ID) {
		return this._cyclesService.getArchivedCycles(projectId);
	}

	/**
	 * @description Get a single archived cycle
	 * @param {ID} id - Cycle ID
	 * @param {ID} projectId - Project ID
	 * @returns Archived cycle detail
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get Archived Cycle' })
	@Get(':id')
	async getArchivedCycle(
		@Param('id') id: ID,
		@Param('projectId') projectId: ID
	) {
		return this._cyclesService.getArchivedCycle(id, projectId);
	}
}
