import { Controller, Get, HttpCode, HttpStatus, Param } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkItemsService } from './work-items.service';

@ApiTags('Work items routes')
@Controller('work-items')
export class WorkItemsController {
	constructor(private readonly _workItemsService: WorkItemsService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Browse work item by identifier' })
	@Get(':identifier')
	async browseWorkItemByIdentifier(@Param('identifier') identifier: string) {
		return await this._workItemsService.browseWorkItemByIdentifier(
			identifier
		);
	}
}
