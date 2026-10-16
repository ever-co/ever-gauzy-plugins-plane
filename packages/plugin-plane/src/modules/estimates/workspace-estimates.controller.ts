import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { EstimatesService } from './estimates.service';

/**
 * ever-gauzy fork: `/estimates` — every project's estimate (its Ever Gauzy task sizes), for workspace views.
 */
@ApiTags('Workspace estimates routes')
@Controller('estimates')
export class WorkspaceEstimatesController {
	constructor(private readonly _estimatesService: EstimatesService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: "Get every project's estimates (task sizes)" })
	@Get()
	async getWorkspaceEstimates() {
		return await this._estimatesService.getWorkspaceEstimates();
	}
}
