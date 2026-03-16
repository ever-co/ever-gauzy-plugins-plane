import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { RecentVisitsService } from './recent-visits.service';
import { IRecentVisit } from '@ever-gauzy/plugin-integration-plane-models';

@Controller('recent-visits')
export class RecentVisitsController {
	constructor(private readonly recentVisitsService: RecentVisitsService) {}

	/**
	 * Retrieves the recent visits for the current employee.
	 *
	 * @returns {Promise<IEmployeeRecentVisit[]>} A promise that resolves to an array of employee recent visits.
	 */
	@HttpCode(HttpStatus.OK)
	@ApiOperation({ summary: 'Get employee recent visits' })
	@ApiResponse({
		status: 200,
		description: 'The employee recent visits were successfully retrieved.'
	})
	@ApiResponse({
		status: 400,
		description: 'Failed to retrieve employee recent visits.'
	})
	@Get()
	async getRecentVisits(): Promise<IRecentVisit[] | IRecentVisit> {
		return this.recentVisitsService.geEmployeetRecentVisits();
	}
}
