import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Patch,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { ID } from '@plane-plugin/models';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
	constructor(private readonly _dashboardService: DashboardService) {}
	/**--------------------------------------------------------------
	 * This function handlers should be updated after implementing authentication
	 *--------------------------------------------------------------/
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update widget' })
	@Patch(':id/widgets/:widgetId')
	async updateDashboardWidget(
		@Param('widgetId') widgetId: ID,
		@Body() data: any,
	) {
		return await this._dashboardService.updateDashboardWidget(
			widgetId,
			data,
		);
	}
}
