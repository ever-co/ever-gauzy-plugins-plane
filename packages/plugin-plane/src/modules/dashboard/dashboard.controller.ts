import {
	Body,
	Controller,
	HttpCode,
	HttpStatus,
	Param,
	Patch
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { ID } from '@ever-gauzy/plugin-integration-plane-models';
import { DashboardService } from './dashboard.service';

@Controller()
export class DashboardController {
	constructor(private readonly _dashboardService: DashboardService) {}

	/**
	 * Updates a specific widget within a dashboard.
	 *
	 * Sends a PATCH request to update the widget with the given ID using the provided data.
	 *
	 * @param {ID} widgetId - The ID of the widget to update.
	 * @param {any} data - The data to update the widget with.
	 * @returns - The updated widget or result of the update operation.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Update widget' })
	@ApiResponse({
		status: 200,
		description: 'The widget was successfully updated.'
	})
	@ApiResponse({
		status: 400,
		description: 'Bad Request. The widget ID or data might be invalid.'
	})
	@Patch(':id/widgets/:widgetId')
	async updateDashboardWidget(
		@Param('widgetId') widgetId: ID,
		@Body() data: any
	) {
		return await this._dashboardService.updateDashboardWidget(
			widgetId,
			data
		);
	}
}
