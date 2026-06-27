import {
	Controller,
	Get,
	HttpCode,
	HttpStatus,
	Param,
	Query
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkItemsService } from './work-items.service';

@ApiTags('Work items routes')
@Controller('work-items')
export class WorkItemsController {
	constructor(private readonly _workItemsService: WorkItemsService) {}

	/**
	 * Browse a work item by its human-readable identifier (e.g. "NELLY-7")
	 *
	 * Matches the Plane Django route:
	 * GET /api/workspaces/:slug/work-items/:project_identifier-:issue_identifier/
	 *
	 * @param {string} identifier - The identifier in format "PROJECT_CODE-SEQUENCE_ID"
	 * @param {string} expand - Optional comma-separated expand fields (e.g. "issue_reactions,issue_link,parent")
	 * @returns The full issue detail with expanded data
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Browse work item by identifier' })
	@Get(':identifier')
	async browseWorkItemByIdentifier(
		@Param('identifier') identifier: string,
		@Query('expand') expand?: string
	) {
		return await this._workItemsService.browseWorkItemByIdentifier(
			identifier,
			expand
		);
	}
}
