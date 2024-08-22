import {
    Controller,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { WorkspaceService } from './workspace.service';

@ApiTags('Workspaces routes')
@Controller()
export class WorkspaceController {
	constructor(private readonly _workspaceService: WorkspaceService) {}

	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get dashboard widgets' })
	@Get(':worspace_name/dashboard')
	async getDashboard(
		@Param('worspace_name') worspace_name: string,
		@Query('dashboard_type') dashboard_type: string,
	) {
		return await this._workspaceService.getDashboard(
			worspace_name,
			dashboard_type,
		);
	}
}
